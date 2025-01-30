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
 * /src/classes/event-requester.class.js
 *
 * The 'event::changes' requester
 * 
    it {
        datetime: '1738063865.324200',
        name: 'cmd::update',
        option: {
            cmd_id: '384',
            value: 2,
            display_value: 2,
            unit: 'ms',
            raw_unit: 'ms',
            valueDate: '2025-01-28 12:31:05',
            collectDate: '2025-01-28 12:31:05',
            alertLevel: 'none'
        }
    }
    it {
        datetime: '1738063865.384700',
        name: 'cmd::update',
        option: {
            cmd_id: '363',
            value: 2,
            display_value: 2,
            unit: 'ms',
            raw_unit: 'ms',
            valueDate: '2025-01-28 12:31:05',
            collectDate: '2025-01-28 12:31:05',
            alertLevel: 'none'
        }
    }
    it {
        datetime: '1738063865.420900',
        name: 'eqLogic::update',
        option: { eqLogic_id: '47', visible: '1', enable: '1' }
    }
    it {
        datetime: '1738070575.801900',
        name: 'jeeObject::summary::update',
        option: {
            object_id: '1',
            keys: {
                security: [Object],
                motion: [Object],
                door: [Object],
                windows: [Object],
                shutter: [Object],
                light: [Object],
                outlet: [Object],
                temperature: [Object],
                humidity: [Object],
                luminosity: [Object],
                power: [Object]
            },
            force: 1,
            name: 'jeeObject::summary::update'
        }
    }
    it {
        datetime: '1738063822.741600',
        name: 'scenario::update',
        option: {
            scenario_id: '32',
            state: 'stop',
            lastLaunch: '2025-01-28 12:30:05'
        }
    }
    it {
        datetime: '1738063101.629200',
        name: 'zwavejs::dependancy_end',
        option: []
    }
    it {
        datetime: '1738063106.329800',
        name: 'zwavejs::driverStatus',
        option: { status: true }
    }
 */

import { Requester } from './requester.class.js';

export class EventRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.event.changes.enabled ){
            const o = new EventRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.event = run.requesters.event || {};
            run.requesters.event.changes = run.requesters.event.changes || {};
            run.requesters.event.changes.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate EventRequester as it is disabled' );
        }
    }

    // private datas

    // private methods

    // install a timer which will gather event changes every interval
    // this requires to have a start datetime, and to keep the last datetime for next call
    async _setupRequester(){
        const config = this.app().config();
        let run = this.app().runtime();
        const self = this;
        // a function to get an initial date and time
        const _fnInitLast = async function(){
            const res = await self.jeedom().callRpc({ method: 'datetime' });
            if( res && res.result ){
                run.requesters.event.changes.last = res.result - config.requesters.event.changes.since;
                if( self.app().verbose()){
                    console.log( '[VERBOSE] EventRequester starts from', run.requesters.event.changes.last );
                }
            }
        };
        await _fnInitLast();
        // a function to get the event since last changes
        //  it is immediately called, without waiting for the next interval
        const method = 'event::changes';
        const _fnRequest = async function(){
            const res = await self.jeedom().callRpc({ method: method, params: { datetime: run.requesters.event.changes.last }});
            //console.debug( 'EventRequester _fnRequest', res );
            if( res && res.result ){
                run.requesters.event.changes.last = res.result.datetime;
                if( res.result.result && Array.isArray( res.result.result )){
                    const inventory = self.app().inventory();
                    res.result.result.forEach(( it ) => {
                        //console.debug( 'it', it );
                        it.option.name = it.name;
                        switch( it.name ){
                            case 'cmd::update':
                                // if the commands inventory has not run yet, just ignore the events
                                //  may happen that we receive an event for a non (or non yet) inventoried command
                                let value = it.option.value;
                                //console.debug( 'it', it, 'inventory', inventory.cmd[it.option.cmd_id] );
                                if( inventory.cmd[it.option.cmd_id] ){
                                    it.option.subType = inventory.cmd[it.option.cmd_id].subType;
                                } else {
                                    console.log( '[NOTICE] command not found in the inventory', it.option.cmd_id );
                                }
                                if( it.option.subType === 'string' || isNaN( parseFloat( value ))){
                                    value = 1;
                                } else {
                                    delete it.option.value;
                                }
                                self.publishMetric( it.option, {
                                    method: 'event::changes',
                                    excludes: [ 'display_value', 'valueDate', 'collectDate' ],
                                    keys: [ 'cmd_id' ],
                                    value: value,
                                    help: 'The last value of the update of a command'
                                });
                                // log when unit is not the same than raw_unit
                                // -> often enough
                                //if( it.option.unit != it.option.raw_unit ){
                                //    console.log( 'Not same unit', it );
                                //}
                                /*
                                self._publishMetric( it, {
                                    method: 'event::changes',
                                    key: it.option.cmd_id,
                                    excludes: [ 'value', 'display_value', 'valueDate', 'collectDate', 'datetime' ],
                                    value: it.datetime,
                                    sufix: '_last',
                                    help: 'The last timestamp of the update of a command'
                                });
                                */
                                break;
                            case 'eqLogic::update':
                                it.name = 'eqLogic::update';
                                self.publishMetric( it.option, {
                                    method: 'event::changes',
                                    value: it.datetime,
                                    suffix: '_stamp',
                                    keys: [ 'eqLogic_id' ],
                                    help: 'The last update of a logical equipment'
                                });
                                break;
                            // ignore if category=message
                            case 'notify':
                                if( it.option.category != 'message' ){
                                    console.debug( 'unhandled notify', it );
                                }
                                break;
                            // just ignore these
                            case 'checkThemechange':
                            case 'jeeObject::summary::update':
                            case 'message::refreshMessageNumber':
                            case 'zwavejs::dependancy_end':
                                    break;
                            case 'scenario::update':
                                self.publishMetric( it.option, {
                                    method: 'event::changes',
                                    excludes: [ 'lastLaunch' ],
                                    value: it.datetime,
                                    suffix: '_stamp',
                                    keys: [ 'scenario_id' ],
                                    help: 'The last update of a scenario'
                                });
                                // state can be 'stop' or 'in progress'
                                if( it.option.state != 'stop' && it.option.state != 'in progress' ){
                                    console.debug( 'scenario state', it );
                                }
                                break;
                                break;
                            case 'zwavejs::driverStatus':
                                self.publishMetric( it.option, {
                                    method: 'event::changes',
                                    help: 'The status of the ZWaveJS driver daemon'
                                });
                                break;
                            default:
                                console.log( 'unhandled event', it.name );
                                console.debug( it );
                        }
                    });
                }
            }
        };
        if( self.jeedom().requestsMethodCount( method ) > 0 ){
            await _fnRequest();
        }
        // and last, setup the interval
        run.requesters.event.changes.handler = setInterval( _fnRequest, config.requesters.event.changes.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {EventRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating EventRequester' );
        }
        return this;
    }
}
