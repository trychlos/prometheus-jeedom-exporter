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
 * /src/classes/plugin-requester.class.js
 *
 * The 'plugin::listPlugin' requester
 * 
 * The listPLugin method provides an inventory:
 * 
  result: [
    {
      id: 'alarm',
      name: 'Alarme',
      description: 'Plugin pour la gestion de la sécurité. Constituez votre alarme facilement (sans programmation), complète et personnalisable.',
      license: 'AGPL',
      installation: '',
      author: 'Loïc',
      require: '4.3',
      requireOsVersion: '',
      category: 'security',
      filepath: '/var/www/jeedom/core/class/../../plugins/alarm/plugin_info/info.json',
      index: 'alarm',
      display: '',
      mobile: '',
      eventjs: 0,
      hasDependency: 0,
      hasTtsEngine: 0,
      maxDependancyInstallTime: 30,
      hasOwnDeamon: 0,
      issue: '',
      changelog: 'https://doc.jeedom.com/fr_FR/plugins/security/alarm/changelog',
      documentation: 'https://doc.jeedom.com/fr_FR/plugins/security/alarm/',
      changelog_beta: 'https://doc.jeedom.com/fr_FR/plugins/security/alarm/beta/changelog',
      documentation_beta: 'https://doc.jeedom.com/fr_FR/plugins/security/alarm/beta',
      source: 'market',
      whiteListFolders: [],
      specialAttributes: [Object],
      info: [Object],
      include: [Object],
      functionality: [Object],
      usedSpace: 0
    },
    {
      id: 'camera',
      name: 'Caméra',
      description: "Plugin permettant l'affichage des caméras IP. L'affichage vidéo de la caméra s'effectue par snapshots (captures) successives toutes les secondes. Le plugin est compatible avec les cameras RTSP.",
      license: 'AGPL',
      installation: '',
      author: 'Jeedom SAS',
      require: '4.2',
      requireOsVersion: '',
      category: 'security',
      filepath: '/var/www/jeedom/core/class/../../plugins/camera/plugin_info/info.json',
      index: 'camera',
      display: 'panel',
      mobile: 'panel',
      eventjs: 0,
      hasDependency: true,
      hasTtsEngine: 0,
      maxDependancyInstallTime: 30,
      hasOwnDeamon: true,
      issue: '',
      changelog: 'https://doc.jeedom.com/fr_FR/plugins/security/camera/changelog',
      documentation: 'https://doc.jeedom.com/fr_FR/plugins/security/camera/',
      changelog_beta: 'https://doc.jeedom.com/fr_FR/plugins/security/camera/beta/changelog',
      documentation_beta: 'https://doc.jeedom.com/fr_FR/plugins/security/camera/beta',
      source: 'market',
      whiteListFolders: [],
      specialAttributes: [Object],
      info: [Object],
      include: [Object],
      functionality: [Object],
      usedSpace: 0
    },
 *
 * The plugin::daemonInfo doesn't work as expected:
 *
    When calling without any params:

    [ERROR] 1738115969234 ERR_NON_2XX_3XX_RESPONSE
    it JPI res null
    [VERBOSE] callRpc() jeeObject::all
    [ERROR] 1738115969249 ERR_NON_2XX_3XX_RESPONSE
    it mqtt2 res null
    [ERROR] 1738115969254 ERR_NON_2XX_3XX_RESPONSE
    it networks res null
    [ERROR] 1738115969258 ERR_NON_2XX_3XX_RESPONSE
    it mail res null
    [ERROR] 1738115969261 ERR_NON_2XX_3XX_RESPONSE
    it camera res null
    [ERROR] 1738115969264 ERR_NON_2XX_3XX_RESPONSE
    it alarm res null
    [ERROR] 1738115969266 ERR_NON_2XX_3XX_RESPONSE
    it mode res null
    [ERROR] 1738115969270 ERR_NON_2XX_3XX_RESPONSE
    it openzwave res null
    [ERROR] 1738115969281 ERR_NON_2XX_3XX_RESPONSE
    it mySensors res null
    [ERROR] 1738115969287 ERR_NON_2XX_3XX_RESPONSE
    it virtual res null
    [ERROR] 1738115969291 ERR_NON_2XX_3XX_RESPONSE
    it rfxcom res null
    [ERROR] 1738115969295 ERR_NON_2XX_3XX_RESPONSE
    it zigbee res null
    [ERROR] 1738115969297 ERR_NON_2XX_3XX_RESPONSE
    it script res null
    [ERROR] 1738115969300 ERR_NON_2XX_3XX_RESPONSE
    it zwavejs res null

    when setting plugin_id:

    [ERROR] 1738116199072 ERR_NON_2XX_3XX_RESPONSE
    it JPI res null
    [ERROR] 1738116199079 ERR_NON_2XX_3XX_RESPONSE
    it mode res null
    [ERROR] 1738116199084 ERR_NON_2XX_3XX_RESPONSE
    it camera res null
    [ERROR] 1738116199090 ERR_NON_2XX_3XX_RESPONSE
    it networks res null
    [ERROR] 1738116199095 ERR_NON_2XX_3XX_RESPONSE
    it mySensors res null
    [ERROR] 1738116199100 ERR_NON_2XX_3XX_RESPONSE
    it openzwave res null
    [ERROR] 1738116199104 ERR_NON_2XX_3XX_RESPONSE
    it mail res null
    [ERROR] 1738116199106 ERR_NON_2XX_3XX_RESPONSE
    it rfxcom res null
    [ERROR] 1738116199110 ERR_NON_2XX_3XX_RESPONSE
    it mqtt2 res null
    [ERROR] 1738116199113 ERR_NON_2XX_3XX_RESPONSE
    it alarm res null
    [VERBOSE] callRpc() jeeObject::all
    [ERROR] 1738116199127 ERR_NON_2XX_3XX_RESPONSE
    it virtual res null
    [ERROR] 1738116199131 ERR_NON_2XX_3XX_RESPONSE
    it script res null
    [ERROR] 1738116199134 ERR_NON_2XX_3XX_RESPONSE
    it zigbee res null
    [ERROR] 1738116199137 ERR_NON_2XX_3XX_RESPONSE
    it zwavejs res null
*/

import { Requester } from './requester.class.js';

export class PluginRequester extends Requester {

    // static datas

    // static methods

    /**
     * @summary Instanciates the PluginRequester
     * NB: a plugin inventory is nonetheless mandatory to be able to request the daemons informations
     * @param {Jeedom} jeedom
     */
    static new( jeedom ){
        const app = jeedom.app();

        if( app.config().requesters.plugin.daemon.info.refresh.enabled ){
            const o = new PluginRequester( jeedom, 'daemon.info' );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.plugin = run.requesters.plugin || {};
            run.requesters.plugin.daemon = run.requesters.plugin.daemon || {};
            run.requesters.plugin.daemon.info = run.requesters.plugin.daemon.info || {};
            run.requesters.plugin.daemon.info.refresh = run.requesters.plugin.daemon.info.refresh || {};
            run.requesters.plugin.daemon.info.refresh.requester = o;
            o._setupDaemonInfoRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate PluginRequester(\'daemon.info\') as it is not enabled' );
        }

        if( app.config().requesters.plugin.list.refresh.enabled || app.config().requesters.plugin.daemon.info.refresh.enabled ){
            const o = new PluginRequester( jeedom, 'list.refresh' );
            let run = app.runtime();
            run.requesters = run.requesters || {};
            run.requesters.plugin = run.requesters.plugin || {};
            run.requesters.plugin.list = run.requesters.plugin.list || {};
            run.requesters.plugin.list.refresh = run.requesters.plugin.list.refresh || {};
            run.requesters.plugin.list.refresh.requester = o;
            o._setupListRequester();
        } else if( app.verbose()){
            console.log( '[VERBOSE] doesn\'t instanciate PluginRequester(\'list.refresh\') as it is not enabled' );
        }
    }

    // private datas

    _mode = null

    // private methods

    // request for the status of a daemon
    //  as of 2025- 1-29, doesn't work
    async _setupDaemonInfoRequester(){
        const config = this.app().config();
        const self = this;
        // a function to get daemons infos
        //  it is immediately called, without waiting for the next interval
        //  doesn't run while the plugins inventory is not ready (and has something inside)
        const _fnRequest = async function(){
            let plugins = self.app().inventory().plugin;
            if( plugins && Object.keys( plugins ).length ){
                Object.keys( plugins ).sort().forEach( async ( it ) => {
                    let res = await self.jeedom().callRpc({ method: 'plugin::deamonInfo', params: { logicalId: it.id }});
                    console.debug( 'it', it, 'health', it.functionality && it.functionality.health, 'res', res );
                    // at of 2025- 1-29, health is always undefined
                });
            }
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.plugin.daemon.info.refresh.handler = setInterval( _fnRequest, config.requesters.plugin.daemon.info.refresh.interval );
    }

    // install a timer which will provide the list of plugins, refreshed every interval
    // nb: the listPlugin method doesn't provide the 'activated' attribute
    //  so have to exoplicitely request for the activated plugins to add the attribute
    async _setupListRequester(){
        const config = this.app().config();
        const self = this;
        const method = 'plugin::listPlugin';
        // a function to get the list of plugins
        //  it is immediately called, without waiting for the next interval
        const _fnRequest = async function(){
            let plugins = {};
            // get the full list of plugins
            let res = await self.jeedom().callRpc({ method: method });
            //console.debug( '_fnRequest', res );
            if( res && res.result && Array.isArray( res.result )){
                res.result.forEach(( it ) => {
                    plugins[it.id] = { ...it };
                    plugins[it.id].activated = 0;
                });
            }
            // get the activated ones only
            res = await self.jeedom().callRpc({ method: method, params: { activateOnly: 1 }});
            if( res && res.result && Array.isArray( res.result )){
                res.result.forEach(( it ) => {
                    plugins[it.id].activated = 1;
                });
            }
            // update the global inventory
            let inventory = self.app().inventory();
            inventory.plugin = plugins;
            // and create metrics
            Object.keys( plugins ).forEach(( id ) => {
                self.publishMetric( plugins[id], {
                    method: method,
                    name: 'plugin',
                    keys: [ 'id' ],
                    excludes: [ 'description', 'filepath', 'changelog', 'documentation', 'changelog_beta', 'documentation_beta', 'info', 'specialAttributes', 'whiteListFolders', 'functionality' ],
                    help: 'The plugins inventory'
                });
            });
        };
        await _fnRequest();
        // and last, setup the interval
        let run = this.app().runtime();
        run.requesters.plugin.list.refresh.handler = setInterval( _fnRequest, config.requesters.plugin.list.refresh.interval );
    }

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Jeedom} jeedom
     * @param {String} mode
     * @returns {PluginRequester} instance
     */
    constructor( jeedom, mode ){
        super( jeedom );
        if( this.app().verbose()){
            console.log( '[VERBOSE] instanciating PluginRequester ('+mode+')' );
        }

        this._mode = mode;

        return this;
    }

    /**
     * @returns {String} the instanciation mode
     */
    mode(){
        return this._mode;
    }
}
