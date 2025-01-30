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
 * /src/classes/eqlogic-requester.class.js
 *
 * The 'eqLogic::all' requester
 * 
 * This is an inventory of the eqLogic objects (i.e. all equipments):
 * 
    {
      id: '137',
      name: 'Dio.24',
      logicalId: '01F8722604',
      generic_type: null,
      object_id: '10',
      eqType_name: 'rfxcom',
      isVisible: '1',
      isEnable: '1',
      configuration: [Object],
      timeout: null,
      category: [Object],
      display: [Object],
      order: '2',
      comment: '',
      tags: 'stock',
      status: [Object],
      cache: []
    },
 */

import { Requester } from './requester.class.js';

export class EqLogicRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.eqLogic.refresh.enabled ){
            const o = new EqLogicRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.eqLogic = run.requesters.eqLogic || {};
            run.requesters.eqLogic.refresh = run.requesters.eqLogic.refresh || {};
            run.requesters.eqLogic.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate EqLogicRequester as it is not enabled' );
        }
    }

    // private datas

    // private methods-

    // request for all eqLogic
    async _setupRequester(){
        const config = this.app().config();
        const self = this;
        // a function to get the eqLogic's
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            const method = 'eqLogic::all';
            const res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                let inventory = self.app().inventory();
                inventory.eqLogic = inventory.eqLogic || {};
                res.result.forEach(( it ) => {
                    // maintain the internal inventory
                    inventory.eqLogic[it.id] = it;
                    // publish the metric
                    self.publishMetric( it, {
                        method: method,
                        name: 'eqLogic',
                        excludes: [ 'configuration', 'category', 'display', 'comment', 'status', 'cache' ],
                        keys: [ 'id' ],
                        help: 'The eqLogic inventory'
                    });
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.eqLogic.refresh.handler = setInterval( _fnRequest, config.requesters.eqLogic.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {EqLogicRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating EqLogicRequester' );
        }
        return this;
    }
}
