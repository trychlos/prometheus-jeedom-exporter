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
 * /src/classes/scenario-requester.class.js
 *
 * The 'scenario::all' requester
 * 
 * This acts as an inventory (but the state which is subject to event channges):
 * 
    {
      id: '21',
      name: 'SGJ31 Energy',
      isActive: '0',
      group: 'Maintenance',
      mode: 'provoke',
      schedule: '',
      scenarioElement: [Array],
      trigger: [Array],
      timeout: '0',
      object_id: '19',
      isVisible: '0',
      display: [Object],
      order: '15',
      description: '',
      configuration: [Object],
      state: 'stop',
      lastLaunch: '2025-01-05 10:45:05'
    },
 */

import { Requester } from './requester.class.js';

export class ScenarioRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.scenario.refresh.enabled ){
            const o = new ScenarioRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.scenario = run.requesters.scenario || {};
            run.requesters.scenario.refresh = run.requesters.scenario.refresh || {};
            run.requesters.scenario.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate ScenarioRequester as it is not enabled' );
        }
    }

    // private datas

    // private methods-

    // install a timer which will provide the scenario properties, refreshed every interval
    async _setupRequester(){
        const config = this.app().config();
        const self = this;
        const method = 'scenario::all';
        // a function to get the summary
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            // get the full summary
            let res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                res.result.forEach(( it ) => {
                    self.publishMetric( it, {
                        method: method,
                        name: 'scenario',
                        excludes: [ 'scenarioElement', 'trigger', 'display', 'configuration', 'lastLaunch', 'description' ],
                        help: 'The scenario/state inventory'
                    });
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.scenario.refresh.handler = setInterval( _fnRequest, config.requesters.scenario.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {ScenarioRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating ScenarioRequester' );
        }
        return this;
    }
}
