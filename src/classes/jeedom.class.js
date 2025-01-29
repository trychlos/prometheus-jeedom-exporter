/*
 * /src/classes/jeedom.class.js
 *
 * A class which gathers Jeedom metrics
 */

import got from 'got';

import { AppBase } from './app-base.class.js';
import { CmdRequester } from './cmd-requester.class.js';
import { EqLogicRequester } from './eqlogic-requester.class.js';
import { EventRequester } from './event-requester.class.js';
import { InteractionRequester } from './interaction-requester.class.js';
import { JeeObjectRequester } from './jee-object-requester.class.js';
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

    // increment the request count
    _requestInc( method ){
        this._requests = this._requests || {};
        this._requests[method] = this._requests[method] || 0;
        this._requests[method] += 1;
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
        let res = null;
        const config = this.app().config();
        try {
            parms = Utils.mergeDeep({ jsonrpc: '2.0', params: { apikey: config.jeedom.key }}, parms );
            if( this.app().verbose()){
                //console.log( '[VERBOSE] callRpc() parms', parms );
            }
            res = await got.post( config.jeedom.url, { json: parms }).json();
            if( this.app().verbose()){
                //console.log( '[VERBOSE] callRpc() result', res );
                console.log( '[VERBOSE] callRpc()', parms.method );
            }
            this._requestInc( parms.method );
        } catch( e ){
            console.log( '[ERROR]', Date.now(), e.code );
            res = null;
        }
        return res;
    }

    /**
     * @param {String} method
     * @returns count the count of requests done for this method
     */
    requestsCount( method ){
        this._requests = this._requests || {};
        this._requests[method] = this._requests[method] || 0;
        return this._requests[method];
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
