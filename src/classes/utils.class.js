/*
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
