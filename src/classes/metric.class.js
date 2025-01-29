/*
 * /src/classes/metric.class.js
 *
 * A class which implements a Prometheus metric
 */

export class Metric {

    // static datas

    // static methods

    // private datas

    // whether this object is to be debugged
    _debug = null;

    // a name
    _name = null;

    // a value
    _value = null;

    // help line
    _help = null;

    // type
    _type = null;

    // an unordered list of labels as name=value, here implemented as a hash
    _labels = null;

    // the key identifier of this particular labelled metric
    _key = null;

    // private methods

    /**
     * Constructor
     * We set up here several timers to fetch metrics from Jeedom
     * @param {Object} args an object with following keys:
     *  - name: the metric name
     *  - value
     *  - help
     *  - type
     *  - labels
     *  - keys: an array of the label names which individualize this metric, defaulting to all present labels and their values
     * @returns {Metric} instance
     */
    constructor( args ){
        this._name = args.name;
        this._value = args.value;
        this._help = args.help;
        this._type = args.type;
        this._labels = { ...args.labels };

        let keys = [];
        if( args.keys && Array.isArray( args.keys )){
            args.keys.sort().forEach(( it ) => {
                if( args.labels[it] ){
                    keys.push( it+'="'+args.labels[it]+'"' );
                }
            });
        } else {
            if( Object.keys( this._labels ).length ){
                Object.keys( this._labels ).sort().forEach(( it ) => {
                    if( this._labels[it] ){
                        keys.push( it+'="'+this._labels[it]+'"' );
                    }
                });
            }
        }
        this._key = keys.join( '_' );

        //console.debug( name, value );
        if( args.debug ){
            this._debug = true;
            console.debug( this );
        }
    
        return this;
    }

    /**
     * @returns {String} the metric help line
     */
    help(){
        return this._help || '';
    }

    /**
     * @returns {String} the key identifier of this labelled metric
     */
    key(){
        return this._key;
    }

    /**
     * @returns {String} the metric labels
     */
    labels(){
        let str = '';
        if( this._labels ){
            let array = [];
            Object.keys( this._labels ).forEach(( it ) => {
                if( this._labels[it] ){
                    const label = it.replaceAll( '::', '_' );
                    array.push( label+'="'+this._labels[it]+'"' );
                }
            });
            str = '{' + array.join( ',' ) + '}';
        }
        if( this._debug ){
            console.debug( 'labels', this._labels, 'str', str );
        }
        return str;
    }

    /**
     * @returns {String} the metric name
     */
    name(){
        return this._name;
    }

    /**
     * @returns {String} the metric type
     */
    type(){
        return this._type;
    }

    /**
     * @returns {Integer} the metric value
     */
    value(){
        return this._value;
    }
}
