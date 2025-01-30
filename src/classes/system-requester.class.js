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
 * /src/classes/jeedom-requester.class.js
 *
 * The 'jeedom::getUsbMapping' requester
 * 
 * An inventory of USB mappings:
 * 
    _fnRequest {
    jsonrpc: '2.0',
    id: 99999,
    result: {
        'RFXCOM RFXtrx433': '/dev/serial/by-id/usb-RFXCOM_RFXtrx433_A1YIOGDF-if00-port0',
        '1a86 USB2.0-Serial': '/dev/serial/by-id/usb-1a86_USB2.0-Serial-if00-port0',
        'dresden_elektronik_ingenieurtechnik_GmbH ConBee_II': '/dev/serial/by-id/usb-dresden_elektronik_ingenieurtechnik_GmbH_ConBee_II_DE2437953-if00',
        '/dev/ttyUSB0': '/dev/ttyUSB0',
        '/dev/ttyUSB1': '/dev/ttyUSB1',
        '/dev/ttyACM0': '/dev/ttyACM0'
    }
    }
 */

import { Requester } from './requester.class.js';

export class SystemRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.system.refresh.enabled ){
            const o = new SystemRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.system = run.requesters.system || {};
            run.requesters.system.refresh = run.requesters.system.refresh || {};
            run.requesters.system.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate SystemRequester as it is not enabled' );
        }
    }

    // private datas

    // private methods-

    // install a timer which will provide the full summary, refreshed every interval
    async _setupRequester(){
        const config = this.app().config();
        const method = 'jeedom::getUsbMapping';
        const self = this;
        // a function to get the summary
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            // get the full summary
            let res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result ){
                // update the inventory
                let inventory = self.app().inventory();
                inventory.system = inventory.system || [];
                inventory.system.usbMappings = res.result;
                // publish the metrics
                Object.keys( res.result ).forEach(( key ) => {
                    self.publishMetric({
                        name: key,
                        mapping: res.result[key]
                    }, {
                        method: method,
                        name: 'usb_mapping',
                        help: 'The USB mapping inventory'
                    });
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.system.refresh.handler = setInterval( _fnRequest, config.requesters.system.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {SystemRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating SystemRequester' );
        }
        return this;
    }
}
