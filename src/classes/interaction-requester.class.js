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
 * /src/classes/interaction-requester.class.js
 *
 * The 'interactQuery::all' requester
 */

import { Requester } from './requester.class.js';

export class InteractionRequester extends Requester {

    // static datas

    // static methods

    /**
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.cmd.refresh.enabled ){
            const o = new InteractionRequester( jeedom );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.interaction = run.requesters.interaction || {};
            run.requesters.interaction.refresh = run.requesters.interaction.refresh || {};
            run.requesters.interaction.refresh.requester = o;
            o._setupRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate InteractionRequester as it is not enabled' );
        }
    }

    // private datas

    // private methods-

    // install a timer which will provide the full summary, refreshed every interval
    async _setupRequester(){
        const method = 'interactQuery::all';
        const config = this.app().config();
        const self = this;
        // a function to get the summary
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            // get the full summary
            let res = await self.jeedom().callRpc({ method: method });
            console.debug( 'InteractionRequester _fnRequest', res );
            // we do not have any interaction to test with
            /*
            if( res && res.result ){
                //console.debug( 'res', res );
                Object.keys( res.result ).forEach(( key ) => {
                    const it = res.result[key];
                    self._publishMetric( it, {
                        method: 'interactQuery::all',
                        value: Date.now(),
                        key: key,
                        excludes: [ 'description' ],
                        help: 'The last timestamp this summary has been seen'
                    });
                });
            }
                */
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.interaction.refresh.handler = setInterval( _fnRequest, config.requesters.interaction.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @returns {InteractionRequester} instance
     */
    constructor( jeedom ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating InteractionRequester' );
        }
        return this;
    }
}
