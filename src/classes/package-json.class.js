/*
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
