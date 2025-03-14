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
 * /src/classes/jee-object-requester.class.js
 *
 * The 'jeeObject::all' requester
 * The 'jeeObject::full' requester
 * 
 * An inventory of all objects and their dependencies
 */

import { Requester } from './requester.class.js';

export class JeeObjectRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     * @returns {JeeObjectRequester} the instanciated object, or null
     */
    static new( jeedom ){
        const app = jeedom.app();

        // have a full inventory with all the dependencies - always enabled
        if( true ){
            const o = new JeeObjectRequester( jeedom, 'full' );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.jeeObject = run.requesters.jeeObject || {};
            run.requesters.jeeObject.inventory = run.requesters.jeeObject.inventory || {};
            run.requesters.jeeObject.inventory.requester = o;
            o._setupFullRequester();
        }

        // have a simple list in order to have metrics
        if( app.config().requesters.jeeObject.refresh.enabled ){
            const o = new JeeObjectRequester( jeedom, 'list' );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.jeeObject = run.requesters.jeeObject || {};
            run.requesters.jeeObject.refresh = run.requesters.jeeObject.refresh || {};
            run.requesters.jeeObject.refresh.requester = o;
            o._setupListRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate JeeObjectRequester as it is not enabled' );
        }
    }

    // private datas

    _mode = null;

    // private methods

    // install a timer which will gather event changes every interval
    // this requires to have a start datetime, and to keep the last datetime for next call
    // NB: this function returns the full hierarchy, though interesting, not usable for an exporter
    async _setupFullRequester(){
        const config = this.app().config();
        const self = this;
        // a function to get the event since last changes
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            const method = 'jeeObject::full';
            const res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                let inventory = self.app().inventory();
                inventory.jeeObject = inventory.jeeObject || {};
                res.result.forEach(( it ) => {
                    inventory.jeeObject[it.id] = it;
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.jeeObject.inventory.handler = setInterval( _fnRequest, config.requesters.jeeObject.inventory.interval );
    }

    // install a timer which will gather event changes every interval
    // this requires to have a start datetime, and to keep the last datetime for next call
    async _setupListRequester(){
        const config = this.app().config();
        const self = this;
        // a function to get the event since last changes
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            const method = 'jeeObject::all';
            const res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                let inventory = self.app().inventory();
                inventory.jeeObject = inventory.jeeObject || {};
                res.result.forEach(( it ) => {
                    // publish the metric
                    self.publishMetric( it, {
                        keys: [ 'id' ],
                        method: method,
                        name: 'jeeObject',
                        excludes: [ 'configuration', 'display_icon', 'display_tagColor' ],
                        help: 'The JeeObject inventory'
                    });
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.jeeObject.refresh.handler = setInterval( _fnRequest, config.requesters.jeeObject.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @param {String} mode the requested requester
     * @returns {JeeObjectRequester} instance
     */
    constructor( jeedom, mode ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating JeeObjectRequester ('+mode+')' );
        }

        this._mode = mode;

        return this;
    }

    /**
     * @returns {String} the instanciation mode
     */
    mode(){
        return this._mode;
    }
}
