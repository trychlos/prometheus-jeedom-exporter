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
 * /src/classes/cmd-requester.class.js
 *
 * The 'cmd::all' requester
 * 
 * This is an inventory of 'cmd' objects:
 * 
    {
      id: '422',
      logicalId: 'Sensor30',
      generic_type: 'POWER',
      eqType: 'mySensors',
      name: 'Plaque_VA',
      order: '18',
      type: 'info',
      subType: 'numeric',
      eqLogic_id: '53',
      isHistorized: '1',
      unite: 'VA',
      configuration: [Object],
      template: [Object],
      display: [Object],
      value: '',
      isVisible: '1',
      alert: [Object],
      currentValue: 29991
    },
    {
      id: '274',
      logicalId: '1.240.0',
      generic_type: 'DONT',
      eqType: 'openzwave',
      name: 'Switch All Off',
      order: '1',
      type: 'action',
      subType: 'other',
      eqLogic_id: '32',
      isHistorized: '0',
      unite: '',
      configuration: [Object],
      template: [Object],
      display: [Object],
      value: '',
      isVisible: '0',
      alert: [],
      currentValue: null
    },
    {
      id: '281',
      logicalId: 'refresh',
      generic_type: '',
      eqType: 'virtual',
      name: 'Rafraichir',
      order: '1',
      type: 'action',
      subType: 'other',
      eqLogic_id: '34',
      isHistorized: '0',
      unite: '',
      configuration: [Object],
      template: [Object],
      display: [Object],
      value: '',
      isVisible: '0',
      alert: [],
      currentValue: null
    },
    {
      id: '282',
      logicalId: '',
      generic_type: '',
      eqType: 'virtual',
      name: 'On 2',
      order: '3',
      type: 'action',
      subType: 'other',
      eqLogic_id: '34',
      isHistorized: '0',
      unite: '',
      configuration: [Object],
      template: [Object],
      display: [Object],
      value: '285',
      isVisible: '1',
      alert: [],
      currentValue: null
    },
 */

import { Requester } from './requester.class.js';

export class CmdRequester extends Requester {

    // static datas

    // static methods

    /**
     * @summary Instanciates the CmdRequester
     *  This is needed either because it is enabled, or because we want publish event::changes metrics (and so need a cmd inventory)
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.cmd.refresh.enabled || app.config().requesters.event.changes.enabled ){
            const o = new CmdRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.cmd = run.requesters.cmd || {};
            run.requesters.cmd.refresh = run.requesters.cmd.refresh || {};
            run.requesters.cmd.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate CmdRequester as it is not enabled' );
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
            const method = 'cmd::all';
            const res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                let inventory = self.app().inventory();
                inventory.cmd = inventory.cmd || {};
                res.result.forEach(( it ) => {
                    // maintain the internal inventory
                    inventory.cmd[it.id] = it;
                    // publish the metric (if enabled)
                    if( config.requesters.cmd.refresh.enabled ){
                        self.publishMetric( it, {
                            method: method,
                            name: 'cmd',
                            excludes: [ 'alert', 'configuration', 'display', 'template', 'value', 'currentValue' ],
                            keys: [ 'id' ],
                            help: 'The cmd inventory'
                        });
                    }
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.cmd.refresh.handler = setInterval( _fnRequest, config.requesters.cmd.refresh.interval );
        //console.debug( 'cmd.refresh.interval', config.requesters.cmd.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {CmdRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating CmdRequester' );
        }

        return this;
    }
}
