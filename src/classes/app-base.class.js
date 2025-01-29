/*
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
