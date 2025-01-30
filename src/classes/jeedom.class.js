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
 * /src/classes/jeedom.class.js
 *
 * A class which gathers Jeedom metrics
 * 
 * The 'got' package provides timings as:
 * 
    res.timings {
        start: 1738152457629,
        socket: 1738152457653,
        lookup: 1738152457686,
        connect: 1738152457686,
        secureConnect: undefined,
        upload: 1738152457686,
        response: 1738152457976,
        end: 1738152457988,
        error: undefined,
        abort: undefined,
        phases: {
            wait: 24,
            dns: 33,
            tcp: 0,
            tls: undefined,
            request: 0,
            firstByte: 290,
            download: 12,
            total: 359
        }
    }
 */

import got from 'got';

import { AppBase } from './app-base.class.js';
import { CmdRequester } from './cmd-requester.class.js';
import { EqLogicRequester } from './eqlogic-requester.class.js';
import { EventRequester } from './event-requester.class.js';
import { InteractionRequester } from './interaction-requester.class.js';
import { JeeObjectRequester } from './jee-object-requester.class.js';
import { Metric } from './metric.class.js';
import { PluginRequester } from './plugin-requester.class.js';
import { ScenarioRequester } from './scenario-requester.class.js';
import { SummaryRequester } from './summary-requester.class.js';
import { SystemRequester } from './system-requester.class.js';
import { Utils } from './utils.class.js';

export class Jeedom extends AppBase {

    // static datas

    // private datas

    // a hash indexed by methods, which contains requests metrics
    //  - count
    _requests = null;

    // private methods

    // increment the requests count by method
    _requestMethodInc( method ){
        this._requests = this._requests || {};
        this._requests.methods = this._requests.methods || {};
        this._requests.methods[method] = this._requests.methods[method] || 0;
        this._requests.methods[method] += 1;
    }

    // increment the requests count by status
    _requestStatusInc( status ){
        this._requests = this._requests || {};
        this._requests.status = this._requests.status || {};
        this._requests.status[status] = this._requests.status[status] || 0;
        this._requests.status[status] += 1;
    }

    // push the timings and the body length of the request
    //  NB: this may end up with a several thousands of rows in this array!! so have to take care of that
    _requestTimingsPush( timings, body ){
        this._requests = this._requests || {};
        this._requests.timings = this._requests.timings || [];
        const limit = this.app().config().exporter.timings.limit || 1000;
        if( this._requests.timings.length > limit ){
            const count = this.app().config().exporter.timings.remove || 100;
            if( this.app().verbose()){
                console.log( '[VERBOSE] requests.timings array has reached its limit of', limit, ', removing', count, 'items' );
            }
            this._requests.timings = this._requests.timings.slice( count );
        }
        this._requests.timings.push({ ...timings, bytes: body.length });
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @returns {Jeedom} instance
     */
    constructor(){
        super( ...arguments );
        return this;
    }

    /**
     * @summary Execute a JSON RPC call to the Jeedom API
     * @param {Object} parms
     * @returns {Object} the JSON resultn, or null if an error has occured
     */
    async callRpc( parms ){
        let json = null;
        const config = this.app().config();
        try {
            parms = Utils.mergeDeep({ jsonrpc: '2.0', params: { apikey: config.jeedom.key }}, parms );
            if( this.app().verbose()){
                console.log( '[VERBOSE] callRpc() parms', JSON.stringify( parms ));
            }
            const res = await got.post( config.jeedom.url, { json: parms });
            this._requestMethodInc( parms.method );
            this._requestStatusInc( res.statusCode );
            this._requestTimingsPush( res.timings, res.body );
            json = JSON.parse( res.body );
            if( this.app().verbose()){
                //console.log( '[VERBOSE] callRpc() res.json()', json );
            }
        } catch( e ){
            console.log( '[ERROR]', e.code );
        }
        return json;
    }

    /**
     * @returns the array of Metric's
     */
    requestsMetrics(){
        let array = [];
        if( this._requests ){
            // count by method
            if( this._requests.methods ){
                let first = true;
                Object.keys( this._requests.methods ).forEach(( method ) => {
                    let args = {
                        name: ( this.app().config().prometheus.prefix || '' )+'request_method_count',
                        value: this.requestsMethodCount( method ),
                        labels: {
                            method: method
                        }
                    };
                    if( first ){
                        args.help = 'The count of requests per called method';
                        args.type = 'counter';
                        first = false;
                    }
                    array.push( new Metric( args ));
                });
            }
            // count by status
            if( this._requests.status ){
                let first = true;
                Object.keys( this._requests.status ).forEach(( status ) => {
                    let args = {
                        name: ( this.app().config().prometheus.prefix || '' )+'request_status_count',
                        value: this.requestsStatusCount( status ),
                        labels: {
                            status: status
                        }
                    };
                    if( first ){
                        args.help = 'The count of requests per returned status';
                        args.type = 'counter';
                        first = false;
                    };
                    array.push( new Metric( args ));
                });
            }
            // average, min, and max timings and flow efficiency
            if( this._requests.timings ){
                let min = null;
                let minit = null;
                let max = null;
                let maxit = null;
                let sum = 0;
                let sumbytes = 0;
                let count = 0;
                this._requests.timings.forEach(( it ) => {
                    if( it.phases.total ){
                        const efficiency = it.bytes / it.phases.total;
                        if( min ===  null || min > efficiency ){
                            min = efficiency;
                            minit = it;
                        }
                        if( max ===  null || max < efficiency ){
                            max = efficiency;
                            maxit = it;
                        }
                        sum += efficiency;
                        sumbytes += it.bytes;
                        count += 1;
                    }
                });
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_lowest_kbps',
                    value: parseInt( min / 1024 * 100 ) / 100,
                    help: 'The lowest efficiency of requests (KB/s)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_lowest_ms',
                    value: minit.phases.total,
                    help: 'The lowest efficiency of requests (ms)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_lowest_bytes',
                    value: minit.bytes,
                    help: 'The lowest efficiency of requests (bytes)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_highest_kbps',
                    value: parseInt( max / 1024 * 100 ) / 100,
                    help: 'The highest efficiency of requests (KB/s)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_highest_ms',
                    value: maxit.phases.total,
                    help: 'The highest efficiency of requests (ms)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_highest_bytes',
                    value: maxit.bytes,
                    help: 'The highest efficiency of requests (bytes)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_avg_kbps',
                    value: parseInt( parseInt( sum / count ) / 1024 * 100 ) / 100,
                    help: 'The average efficiency of requests (KB/s)',
                    type: 'gauge'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_transferred_kb',
                    value: parseInt( parseInt( sumbytes ) / 1024 * 100 ) / 100,
                    help: 'The total transferred bytes (KB)',
                    type: 'counter'
                }));
                array.push( new Metric({
                    name: ( this.app().config().prometheus.prefix || '' )+'request_timing_count',
                    value: count,
                    help: 'The total count of in-memory requests results',
                    type: 'counter'
                }));
            }
        }
        return array;
    }

    /**
     * @param {String} method
     * @returns the count of requests done for this method
     */
    requestsMethodCount( method ){
        this._requests = this._requests || {};
        this._requests.methods = this._requests.methods || {};
        this._requests.methods[method] = this._requests.methods[method] || 0;
        return this._requests.methods[method];
    }

    /**
     * @param {String} status
     * @returns the count of requests done which have returned this status
     */
    requestsStatusCount( status ){
        this._requests = this._requests || {};
        this._requests.status = this._requests.status || {};
        this._requests.status[status] = this._requests.status[status] || 0;
        return this._requests.status[status];
    }

    /**
     * @summary Install all requesters and let them run
     */
    async start(){
        CmdRequester.new( this );
        EqLogicRequester.new( this );
        EventRequester.new( this );
        InteractionRequester.new( this );
        JeeObjectRequester.new( this );
        PluginRequester.new( this );
        ScenarioRequester.new( this );
        SummaryRequester.new( this );
        SystemRequester.new( this );
    }
}
