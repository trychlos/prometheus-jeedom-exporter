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

import promClient from 'prom-client';

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
            o._setupPromClientRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate EventRequester as it is disabled' );
        }
    }

    // private datas

    // private methods

    // install a timer which will gather event changes every interval
    // this requires to have a start datetime, and to keep the last datetime for next call
    // NB: This is a requester based on periodic requests of Jeedom.
    //  Starting with v2, this requester is obsoleted, and replaced with a prom-client-based collect one.
    async _setupRequesterByInterval(){
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
        // a function to get the event changes since last request
        const method = 'event::changes';
        const _fnRequest = async function(){
            const res = await self.jeedom().callRpc({ method: method, params: { datetime: run.requesters.event.changes.last }});
            if( config.requesters.event.changes.traces && config.requesters.event.changes.traces.rpc ){
                console.debug( 'EventRequester _fnRequest', res );
            }
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
                                let cmdName = '';
                                let eqLogicId = -1;
                                let eqLogicName = '';
                                let objectId = -1;
                                let objectName = '';
                                let humanName = '';
                                if( inventory.cmd[it.option.cmd_id] ){
                                    it.option.subType = inventory.cmd[it.option.cmd_id].subType;
                                    cmdName = inventory.cmd[it.option.cmd_id].name;
                                    eqLogicId = inventory.cmd[it.option.cmd_id].eqLogic_id;
                                } else {
                                    console.log( '[NOTICE] command not found in the inventory', it.option.cmd_id );
                                }
                                // try to get a full human name
                                if( inventory.eqLogic[eqLogicId] ){
                                    eqLogicName = inventory.eqLogic[eqLogicId].name;
                                    objectId = inventory.eqLogic[eqLogicId].object_id;
                                }
                                if( inventory.jeeObject[objectId] ){
                                    objectName = inventory.jeeObject[objectId].name;
                                }
                                if( objectName && eqLogicName && cmdName ){
                                    humanName = '['+objectName+']['+eqLogicName+']['+cmdName+']';
                                    it.option.humanName = humanName;
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
                                    help: 'The last value of the update of a command',
                                    dump: config.requesters.event.changes.traces && config.requesters.event.changes.traces.metrics
                                });
                                // log when unit is not the same than raw_unit
                                // -> often enough
                                //if( it.option.unit != it.option.raw_unit ){
                                //    console.log( 'Not same unit', it );
                                //}
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

    // prom-client-based requester
    // prom-client can only collect metrics for predefined objects, so cannot dynamically discover the metrics to be published
    // unless we drastically reduce the published labels
    async _setupPromClientRequester(){
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
        // a function to get the event since last request
        // it is called each time Prometheus scrapes its metrics
        // returns an array of metrics to be published
        const method = 'event::changes';
        const _fnRequest = async function(){
            let metrics = [];
            const res = await self.jeedom().callRpc({ method: method, params: { datetime: run.requesters.event.changes.last }});
            if( config.requesters.event.changes.traces && config.requesters.event.changes.traces.rpc ){
                console.debug( 'EventRequester _fnRequest res', res );
                console.debug( 'EventRequester _fnRequest result length is', res.result.length );
            }
            if( res && res.result ){
                run.requesters.event.changes.last = res.result.datetime;
                if( res.result.result && Array.isArray( res.result.result )){
                    const inventory = self.app().inventory();
                    res.result.result.forEach(( it ) => {
                        if( config.requesters.event.changes.traces.rpc ){
                            console.debug( 'EventRequester _fnRequest it', it );
                        }
                        let eqLogicName = '';
                        let humanName = '';
                        let metric;
                        switch( it.name ){
                            case 'cmd::update':
                                // if the commands inventory has not run yet, just ignore the events
                                //  may happen that we receive an event for a non (or non yet) inventoried command
                                //console.debug( 'it', it, 'inventory', inventory.cmd[it.option.cmd_id] );
                                let cmdName = '';
                                let eqLogicId = -1;
                                let objectId = -1;
                                let objectName = '';
                                if( inventory.cmd[it.option.cmd_id] ){
                                    it.option.subType = inventory.cmd[it.option.cmd_id].subType;
                                    cmdName = inventory.cmd[it.option.cmd_id].name;
                                    eqLogicId = inventory.cmd[it.option.cmd_id].eqLogic_id;
                                } else {
                                    console.log( '[NOTICE] command not found in the inventory', it.option.cmd_id );
                                }
                                // try to get a full human name
                                if( inventory.eqLogic[eqLogicId] ){
                                    eqLogicName = inventory.eqLogic[eqLogicId].name;
                                    objectId = inventory.eqLogic[eqLogicId].object_id;
                                }
                                if( inventory.jeeObject[objectId] ){
                                    objectName = inventory.jeeObject[objectId].name;
                                }
                                if( objectName && eqLogicName && cmdName ){
                                    humanName = '['+objectName+']['+eqLogicName+']['+cmdName+']';
                                }
                                // have a suitable value
                                let value = it.option.value;
                                if( it.option.subType === 'string' || isNaN( parseFloat( value ))){
                                    value = 1;
                                }
                                metric = {
                                    labels: {
                                        name: it.name,
                                        method: method,
                                        cmd_id: it.option.cmd_id
                                    },
                                    value: Number( value )
                                };
                                if( humanName ){
                                    metric.labels.humanName = humanName;
                                }
                                if( it.option.raw_unit ){
                                    metric.labels.raw_unit = it.option.raw_unit;
                                }
                                if( config.requesters.event.changes.traces && config.requesters.event.changes.traces.metrics ){
                                    console.debug( 'EventRequester metric', metric );
                                }
                                metrics.push( metric );
                                break;
                            case 'eqLogic::update':
                                if( inventory.eqLogic[it.option.eqLogic_id] ){
                                    eqLogicName = inventory.eqLogic[it.option.eqLogic_id].name;
                                }
                                if( eqLogicName ){
                                    humanName = '['+eqLogicName+']';
                                }
                                metric = {
                                    labels: {
                                        name: it.name,
                                        method: method,
                                        eqLogic_id: it.option.eqLogic_id
                                    },
                                    value: Number( it.datetime )
                                };
                                if( humanName ){
                                    metric.labels.humanName = humanName;
                                }
                                if( config.requesters.event.changes.traces && config.requesters.event.changes.traces.metrics ){
                                    console.debug( 'EventRequester metric', metric );
                                }
                                metrics.push( metric );
                                break;
                            default:
                                console.log( 'unhandled event', it.name );
                        }
                    });
                }
            }
            return metrics;
        };
        // define the metrics to be published and their collector functions
        run.requesters.event.changes.gauges = [];
        //console.log( 'promClient', promClient );
        run.requesters.event.changes.gauges.push( new promClient.Gauge({
            name: 'jeedom_event_changes',
            help: 'Some change somewhere in Jeedom',
            async collect(){
                const metrics = await _fnRequest();
                metrics.forEach(( it ) => {
                    this.set( it.labels, it.value );
                });
            },
            labelNames: [ 'cmd_id', 'eqLogic_id', 'method', 'name', 'humanName', 'raw_unit' ]
        }));
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
