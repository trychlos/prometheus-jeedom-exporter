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
 * /src/classes/utils.class.js
 *
 * A class which contains some utilities.
 */

export class Utils {

    // static datas

    // static methods

    /**
     * Simple object check.
     * From https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
     * NB: this is to spare a lodash dependency
     * @param item
     * @returns {boolean}
     */
    static isObject( item ){
        return ( item && typeof item === 'object' && !Array.isArray(item));
    }
    
    /**
     * Deep merge two objects.
     * @param target
     * @param ...sources
     */
    static mergeDeep( target, ...sources ){
        if( !sources.length ) return target;
        const source = sources.shift();

        if( Utils.isObject( target ) && Utils.isObject( source )){
            for( const key in source ){
                if( Utils.isObject( source[key] )){
                    if( !target[key] ) Object.assign( target, { [key]: {} });
                    Utils.mergeDeep( target[key], source[key] );
                } else {
                    Object.assign( target, { [key]: source[key] });
                }
            }
        }

        return Utils.mergeDeep( target, ...sources );
    }
}
