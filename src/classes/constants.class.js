/*
 * /src/classes/constants.class.js
 *
 * A class which contains our constants and default values.
 */

export class Constants {

    // static datas

    // the default configuration filename
    static configPath = '/etc/prometheus/jeedom_exporter.yml';

    // the default configuration
    static configDefaults = {
        prometheus: {
            port: 9124,
            prefix: 'jeedom_',
            metrics: '/metrics'
        },
        jeedom: {
            url: 'http://127.0.0.1/core/api/jeeApi.php',
            key: null
        },
        // some internal exporter configuration
        exporter: {
            // we keep in memory an array of requests timings as computed by got
            //  each item is about 450 bytes
            //  do not leave this array grow until being too big to be kept manageable
            timings: {
                limit: 10000,                   // size is limited to ~4.3MB
                remove: 100                     // we remove items by range of 100 each time it is needed
            }
        },
        // the requesters configurations
        // defaulting to only be interested by event changes which are requested every minute
        requesters: {
            cmd: {
                refresh: {
                    enabled: false,
                    interval: 3600000           // 60*60*1000=1h en ms
                }
            },
            eqLogic: {
                refresh: {
                    enabled: false,
                    interval: 3600000           // 60*60*1000=1h en ms
                }
            },
            event: {
                changes: {
                    enabled: true,
                    interval: 60000,            // 60*1000=1mn en ms
                    since: 600000               // 10*60*1000=10mn en ms: when starting, rewind 10mn to init the metrics
                }
            },
            interaction: {
                refresh: {
                    enabled: false,
                    interval: 3600000           // 60*60*1000=1h en ms
                }
            },
            jeeObject: {
                // this rather targets the full in-memory inventory, is not published as metrics
                inventory: {
                    interval: 3600000           // 60*60*1000=1h en ms
                },
                // this instead is used for publish an inventory as metrics
                refresh: {
                    enabled: false,
                    interval: 3600000           // 60*60*1000=1h en ms
                }
            },
            plugin: {
                daemon: {
                    info: {
                        refresh: {
                            enabled: false,
                            interval: 3600000   // 60*60*1000=1h en ms
                        }
                    }
                },
                list: {
                    refresh: {
                        enabled: false,
                        interval: 3600000       // 60*60*1000=1h en ms
                    }
                }
            },
            scenario: {
                refresh: {
                    enabled: false,
                    interval: 3600000    // 60*60*1000=1h en ms
                }
            },
            summary: {
                refresh: {
                    enabled: false,
                    interval: 3600000    // 60*60*1000=1h en ms
                }
            },
            system: {
                refresh: {
                    enabled: false,
                    interval: 3600000    // 60*60*1000=1h en ms
                }
            }
        }
    };
}
