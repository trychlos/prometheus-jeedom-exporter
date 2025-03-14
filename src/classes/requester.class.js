/*
 * prometheus-jeedom-exporter - A Prometheus Exporter for jeedom
 * Copyright (C) 2025 Pierre Wieser <p.wieser@trychlos.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 * /src/classes/requester.class.js
 *
 * The base class for all the requesters
 */

import { AppBase } from './app-base.class.js';
import { Metric } from './metric.class.js';

export class Requester extends AppBase {

    // static datas

    // private datas

    // the Jeedom instance
    _jeedom = null;

    // private methods

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {Requester} instance
     */
    constructor( jeedom ){
        super( jeedom.app());

        this._jeedom = jeedom;
    
        return this;
    }

    /**
     * @param {Object} o an object
     * @returns {Object} the same object where all sub-objects have been gathered in the parent
     */
    gatherSubObjects( o ){
        const _fn = function( dest, oin, prefix='' ){
            Object.keys( oin ).forEach(( k ) => {
                const v = oin[k];
                if( v !== null ){
                    if( Array.isArray( v )){
                        if( v.length ){
                            console.debug( 'array', prefix, k, v );
                            /*
                            let array = [];
                            v.forEach(( it ) => {
                                console.debug( 'prefix', prefix, 'k', k, 'v', v, 'it', it );
                                let res = {};
                                _fn( res, it );
                                array.push( res );
                            });
                            dest[prefix+k] = array.join( ',' );
                            */
                        }
                    } else if( typeof v === 'object' ){
                        _fn( dest, v, prefix+k+'_' );
                    } else {
                        dest[prefix+k] = v;
                    }
                }
            });
        }
        let result = {};
        _fn( result, o );
        return result;
    }

    /**
     * @returns {Jeedom} the Jeedom instance
     */
    jeedom(){
        return this._jeedom;
    }

    /**
     * @summary Ask the application to publish a new metric
     *  Default is to create a matric with:
     *  - name is the method
     *  - value is 1
     *  - labels are all keys from the source objects
     * @param {Object} source a source object as returned by the Jeedom JSON RPC API
     * @param {Object} opts an optional options object with following keys
     *  - method: the method which has been called, defaulting to ''
     *  - name: the radical of the name of the metric to be published
     *      this radical defaults to the method name
     *  - prefix: a prefix to be prepended to the name radical, defaulting to the configured one
     *  - suffix: a suffix to be appended to the name radical, defaulting to ''
     *  - excludes: an array of the keys to be removed from the source object before the publication, defaulting to none
     *  - keys: an array of the labels to be used to build the key metric identifier, defaulting to none (which means all labels are used)
     *  - value: the value of the metric, defaulting to 1
     *  - help: the help string, defaulting to none
     *  - type: the metric type, defaulting to 'gauge'
     *  - dump: whether to dump the published metric, defaulting to false
     */
    publishMetric( source, opts={} ){
        let args = {};
        // build the metric name
        const prefix = this.app().config().prometheus.prefix || '';
        let radical = opts.name || opts.method || '';
        const suffix = opts.suffix || '';
        let name = prefix + radical + suffix;
        name = name.replaceAll( '::', '_' ).toLowerCase();
        // have the method as a label
        if( opts.method ){
            source.method = opts.method
        }
        // remove excluded labels
        if( opts.excludes && Array.isArray( opts.excludes )){
            opts.excludes.forEach(( it ) => {
                delete source[it];
            });
        }
        // try to gather remaining sub-objects
        source = this.gatherSubObjects( source );
        // build the metric args
        args = { ...args, ...{
            name: name,
            value: opts.value || 1,
            type: opts.type || 'gauge',
            labels: source
        }};
        if( opts.help ){
            args.help = opts.help;
        }
        if( opts.keys ){
            args.keys = opts.keys;
        }
        if( opts.dump ){
            console.debug( 'Requester::publishMetric()', args )
        }
        this.app().push( new Metric( args ));
    }
}
