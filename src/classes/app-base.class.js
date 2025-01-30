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
 * /src/classes/app-base.class.js
 *
 * A common base class to handle the 'app' link
 */

export class AppBase {

    // static datas

    // private datas

    // the Application instance
    _app = null;

    // private methods

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Application} app the application
     * @returns {AppBase} instance
     */
    constructor( app ){
        this._app = app;
        return this;
    }

    /**
     * @returns {Application} the application instance
     */
    app(){
        return this._app;
    }
}
