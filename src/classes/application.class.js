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
 * /src/classes/application.class.js
 * 
 * Application singleton.
 */

import { Command, Option } from 'commander';
import express from 'express';
import fs from 'fs';
import YAML from 'yaml';

import { Constants } from './constants.class.js';
import { Inventory } from './inventory.class.js';
import { Jeedom } from './jeedom.class.js';
import { PackageJson } from './package-json.class.js';
import { Utils } from './utils.class.js';

export class Application {

    // static datas

    // this application
    static singleton = null;

    // private datas

    // the commander object which parses the command-line
    _command = null;

    // the configuration
    _config = null;

    // whether the configuration filename has been specified on the command-line
    _configSet = false;

    // the express server which handles HTTP requests
    _express = null;

    // the inventory
    _inventory = null;

    // the jeedom metrics instance
    _jeedom = null;

    // the published metrics
    _metrics = null;

    // the package json file
    _package = null;

    // the runtime object
    _run = null;

    // startup Date
    _startup = null;

    // whether we run verbosely
    _verbose = null;

    // the read YAML file
    _yaml = null;

    // private methods

    /*
     * @summary Interprets the startup command-line arguments
     * @returns {Boolean} whether the command-line has been successfully interpreted
     */
    _commandLine(){
        let res = true;
        const self = this;
        // a specific parser for '--config' option
        const _fnOptConfig = function( value, defaultValue){
            this._configSet = true;
            return value;
        };
        this._command = new Command();
        this._command
            .name( 'node /path/to/index.js' )
            .description( self._package.description())
            .version( self._package.version())
            .addOption(
                new Option( '-c, --config <config>', 'configuration filename' )
                    .default( Constants.configPath )
                    .argParser( _fnOptConfig ))
            .option( '-p, --port <port>', 'Prometheus scraping port', Constants.configDefaults.prometheus.port )
            .option( '-k, --key <key>', 'Jeedom API key' )
            .option( '-v, --verbose', 'run verbosely', false )
            .parse( process.argv );
        const opts = this._command.opts();
        this._config = { ...Constants.configDefaults };
        //console.debug( 'options', opts );
        // check for the configuration, which will acts as a default before parsing command-line
        if( opts.config ){
            res &= this._parseConfig( opts.config );
        }
        // check for a scraping port number
        if( opts.port ){
            const port = parseInt( opts.port );
            if( port < 1 || isNaN( port ) ){
                console.error( 'port number must be numeric and greater than 1' );
                res = false;
            } else {
                this.config().prometheus.port = port;
            }
        }
        // check for an API key
        if( !this.config().jeedom.key && !opts.key ){
            console.error( 'Jeedom API key is not specified, but is mandatory' );
            res = false;
        } else if( opts.key ){
            this.config().jeedom = this._config.jeedom || {};
            this.config().jeedom.key = opts.key;
        }
        // whether we run vebosely
        this._verbose = opts.verbose;
        //console.debug( 'returning', res );
        return res;
    }

    // display a greetings line
    _greetings(){
        const pck = this.package();
        console.log( pck.name()+' v '+pck.version()+' - '+pck.description());
        console.log( 'This program is free software. It comes with absolutely no warranty.' );
        console.log( 'You are welcome to redistribute it under certain conditions. See the LICENCE file.' );
        console.log( 'Starting...' );
    }

    // display as YAML the internal configuration of the exporter
    _pageConfig( req, res, next ){
        //const str = JSON.stringify( this._config, null, 2 );
        const str = YAML.stringify( this._config, null, 2 );
        res.set( 'Content-Type', 'text/html' );
        res.send( '<pre>'+str+'</pre>' );
    }

    // the home page with its links
    _pageHome( req, res, next ){
        const metrics = this.config().prometheus.metrics;
        res.set( 'Content-Type', 'text/html' );
        res.send(
            '<!DOCTYPE html>'
            + '<html>'
            + '  <head>'
            + '    <title>'+this._package.description()+'</title>'
            + '    <style>'
            + '      .header {'
            + '        height: 7em;'
            + '        background-color: chocolate;'
            + '        color: white;'
            + '        padding-left: 0.5em;'
            + '      }'
            + '      h1 {'
            + '        padding-top: 0.5em;'
            + '        margin-block: 0;'
            + '        margin-inline: 0;'
            + '      }'
            + '      ul li {'
            + '        font-size: 1.25em;'
            + '        height: 1.25em;'
            + '        line-height: 1.25em;'
            + '      }'
            + '      ul li:not( :first-child ){'
            + '        margin-top: 0.25em;'
            + '      }'
            + '    </style>'
            + '  </head>'
            + '  <body>'
            + '    <div class="header">'
            + '      <h1>'+this._package.description()+'</h1>'
            + '      <p>Version: '+this._package.version()+'</p>'
            + '    </div>'
            + '    <div class="links">'
            + '      <ul>'
            + '        <li><a href="'+metrics+'">Metrics</a></li>'
            + '        <li><a href="/config">Configuration</a></li>'
            + '        <li><a href="/inventory">Inventory</a></li>'
            + '      </ul>'
            + '    </div>'
            + '  </body>'
            + '</html>'
        );
    }

    // the inventory page
    // based on a proposition from https://chat.deepseek.com/a/chat/s/82cdcc7f-dad9-4d41-866b-f5c1612fb88a
    _pageInventory( req, res, next ){
        const inventory = this.inventory();
        let page = '<!DOCTYPE html>';
        if( inventory ){
            // Define the function outside of `generateHTML` so it's accessible in the template string
            const createCollapsibleElement = function( key, value, level=0 ){
                //console.log( 'level', level, 'key', key );
                let html = `
                    <div>
                        <div class="collapsible">${key}${typeof value === "object" && value !== null ? ` (${Array.isArray(value) ? "Array" : "Object"})` : ""}</div>
                        <div class="content">`;

                if( typeof value === "object" && value !== null ){
                    Object.keys( value ).forEach( subKey => {
                        html += createCollapsibleElement( subKey, value[subKey], level+1 );
                    });
                } else {
                    html += value;
                }

                html += '</div></div>';
                return html;
            };
            page += `
                <html>
                  <head>
                    <title>+this._package.description()+</title>
                    <style>
                      .collapsible {
                        cursor: pointer;
                        padding: 5px;
                        border: 1px solid #ccc;
                        margin: 5px 0;
                        background-color: #f9f9f9;
                      }
                      .content {
                        padding-left: 20px;
                        border-left: 2px solid #ccc;
                        margin-left: 10px;
                        display: none;
                      }
                      .content.visible {
                        display: block;
                      }
                    </style>
                  </head>
                  <body>
                    ${Object.keys( inventory ).map( key => createCollapsibleElement( key, inventory[key] )).join("")}
                    <script>
                      document.addEventListener("DOMContentLoaded", function(){
                        const collapsibles = document.querySelectorAll( ".collapsible" );
                        collapsibles.forEach( collapsible => {
                          collapsible.addEventListener( "click", function(){
                            const content = this.nextElementSibling;
                            content.classList.toggle( "visible" );
                          });
                          if( collapsible.nextElementSibling.children.length > 0 ){
                            const toggleButton = document.createElement( "button" );
                            toggleButton.textContent = "Toggle All";
                            toggleButton.style.marginLeft = "10px";
                            toggleButton.addEventListener( "click", function( e ){
                              e.stopPropagation();
                              const content = collapsible.nextElementSibling;
                              const isVisible = content.classList.contains( "visible" );
                              content.classList.toggle( "visible", !isVisible );
                              content.querySelectorAll( ".content" ).forEach(subContent => {
                                subContent.classList.toggle( "visible", !isVisible );
                              });
                            });
                            collapsible.appendChild( toggleButton );
                          }
                        });
                      });
                    </script>
                  </body>
                </html>
            `;
        } else if( this.verbose()){
            console.log( '[VERBOSE] inventory is empty' );
            page += `
                <html>
                  <head>
                    <title>+this._package.description()+</title>
                  </head>
                  <body>
                    <pre>
                      Inventory is empty
                    </pre>
                  </body>
                </html>
            `;
        }
        res.set( 'Content-Type', 'text/html' );
        res.send( page );
    }

    // the metrics page
    _pageMetrics( req, res, next ){
        let str = '';
        // send requests metrics
        this.jeedom().requestsMetrics().forEach(( it ) => {
            const name = it.name();
            const help = it.help();
            if( help ){
                str += '# HELP '+name+' '+help+'\n';
            }
            const type = it.type();
            if( type ){
                str += '# TYPE '+name+' '+it.type()+'\n';
            }
            str += name+it.labels()+' '+it.value()+'\n';
        });
        // send jeedom metrics
        if( this._metrics ){
            Object.keys( this._metrics ).forEach(( name ) => {
                const metrics = this._metrics[name];
                let first = true;
                Object.keys( metrics ).forEach(( key ) => {
                    const metric = this._metrics[name][key];
                    if( first ){
                        str += '# HELP '+name+' '+metric.help()+'\n';
                        str += '# TYPE '+name+' '+metric.type()+'\n';
                        first = false;
                    }
                    str += name+metric.labels()+' '+metric.value()+'\n';
                });
            });
        }
        res.set( 'Content-Type', 'text/plain' );
        res.send( str );
    }

    // @summary Parse the provided configuration filename
    // @returns {Boolean} whether the configuration is valid (if any)
    _parseConfig( filename ){
        let res = true;
        try {
            const file = fs.readFileSync( filename, 'utf8' );
            if( file ){
                this._yaml = YAML.parse( file );
                //console.debug( 'yaml', this._yaml );
                this._config = Utils.mergeDeep( this._config, this._yaml );
            }
        } catch( e ){
            // if we do not have specify a configuration file, then ignore if the default doesn't exist
            // rationale: if we want run without any specific configuration, just accept that
            if( e.code !== 'ENOENT' || this._configSet ){
                console.error( e );
                res = false;
            }
        }
        return res;
    }

    /**
     * Constructor
     * @returns {Application} singleton
     */
    constructor(){
        if( Application.singleton ){
            //console.log( '[Application] returning already instanciated singleton' );
            return Application.singleton;
        }
        //console.log( '[Application] instanciation' );

        this._startup = new Date();
        this._package = new PackageJson();

        Application.singleton = this;
        return Application.singleton;
    }

    /**
     * @returns {Object} the runtime configuration object
     */
    config(){
        return this._config;
    }

    /**
     * @returns {Inventory} the inventory instance
     */
    inventory(){
        return this._inventory;
    }

    /**
     * @returns {Jeedom} the jeedom instance
     */
    jeedom(){
        return this._jeedom;
    }

    /**
     * @returns {PackageJson} the JSON package
     */
    package(){
        return this._package;
    }

    /**
     * @summary Push a new metric
     * @param {Metric} a metric
     */
    push( metric ){
        this._metrics = this._metrics || {};
        this._metrics[ metric.name() ] = this._metrics[ metric.name() ] || {};
        this._metrics[ metric.name() ][ metric.key() ] = metric;
    }

    /**
     * @summary Run the Express server
     */
    run(){
        if( this._commandLine()){
            this._greetings();

            this._run = {};
            this._app = express();

            if( this.verbose()){
                console.log( '[VERBOSE] runtime config', this.config());
            }

            this._inventory = new Inventory();

            this._jeedom = new Jeedom( this );
            // start is an async function, but we do not care here
            this._jeedom.start();
    
            // define routes
            this._app.get( '/', ( req, res, next ) => {
                this._pageHome( req, res, next );
            });
            this._app.get( '/config', ( req, res, next ) => {
                this._pageConfig( req, res, next );
            });
            this._app.get( '/inventory', ( req, res, next ) => {
                this._pageInventory( req, res, next );
            });
            this._app.get( this.config().prometheus.metrics, ( req, res, next ) => {
                this._pageMetrics( req, res, next );
            });
    
            // and start the server
            this._app.listen( this.config().prometheus.port, () => {
                console.log( 'Server is now running on port', this.config().prometheus.port );
            });
        }
    }

    /**
     * @returns {Object} the runtime data
     */
    runtime(){
        return this._run;
    }

    /**
     * @returns {Boolean} whether we run verbosely
     */
    verbose(){
        return this._verbose;
    }
}
