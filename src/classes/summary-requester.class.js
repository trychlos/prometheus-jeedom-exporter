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
 * /src/classes/summary-requester.class.js
 *
 * The 'summary::global' requester
 * 
 * This is an inventory:
 * 
   humidity: {
      key: 'humidity',
      name: 'Humidité',
      calcul: 'avg',
      icon: '<i class="fa fa-tint"></i>',
      iconnul: null,
      unit: '%',
      hidenumber: '0',
      hidenulnumber: '0',
      count: '',
      allowDisplayZero: '1',
      ignoreIfCmdOlderThan: '',
      value: null
    },
    temperature: {
      key: 'temperature',
      name: 'Température',
      calcul: 'avg',
      icon: '<i class="icon divers-thermometer31"></i>',
      iconnul: null,
      unit: '°C',
      hidenumber: '0',
      hidenulnumber: '0',
      count: '',
      allowDisplayZero: '1',
      ignoreIfCmdOlderThan: '',
      value: null
    },
 */

import { Requester } from './requester.class.js';

export class SummaryRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.summary.refresh.enabled ){
            const o = new SummaryRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.summary = run.requesters.summary || {};
            run.requesters.summary.refresh = run.requesters.summary.refresh || {};
            run.requesters.summary.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate SummaryRequester as it is not enabled' );
        }
    }

    // private datas

    // private methods

    // install a timer which will provide the full summary, refreshed every interval
    async _setupRequester(){
        const config = this.app().config();
        const method = 'summary::global';
        const self = this;
        // a function to get the summary
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            // get the full summary
            let res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result ){
                // set the inventory
                let inventory = self.app().inventory();
                inventory.summary = res.result;
                // publish the metrics
                Object.keys( res.result ).forEach(( key ) => {
                    const it = res.result[key];
                    self.publishMetric( it, {
                        method: method,
                        name: 'summary',
                        keys: [ 'key' ],
                        excludes: [ 'description', 'icon', 'value' ],
                        help: 'The summary inventory'
                    });
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.summary.refresh.handler = setInterval( _fnRequest, config.requesters.summary.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {SummaryRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating SummaryRequester' );
        }
        return this;
    }
}
