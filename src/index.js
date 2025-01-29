/*
 * /src/index.js
 */

import { Application } from './classes/application.class.js';

const app = new Application();

if( app.commandLine()){
    app.run();
}
