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
 * /src/classes/package.class.js
 *
 * Read this module package.json file
 */

import fs from 'fs';

export class PackageJson {

    // static datas

    // private datas

    // the package.json content
    _content = null;

    /**
     * Constructor
     * @returns {PackageJson} instance
     */
    constructor(){

        this._content = JSON.parse( fs.readFileSync( import.meta.dirname+'/../../package.json', 'utf8' ));

        return this;
    }

    /**
     * Getter
     * @returns {String} the package author
     */
    author(){
        return this._content.author;
    }

    /**
     * Getter
     * @returns {String} the package description
     */
    description(){
        return this._content.description;
    }

    /**
     * Getter
     * @returns {String} the package name
     */
    name(){
        return this._content.name;
    }

    /**
     * Getter
     * @returns {String} the package version
     */
    version(){
        return this._content.version;
    }
}
