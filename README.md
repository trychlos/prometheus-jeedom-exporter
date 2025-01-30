# jeedom_exporter

## What is it ?

A [Node.js](https://nodejs.org/)+[Express](https://expressjs.com/)-based package which exports some [Jeedom](https://jeedom.com/) metrics to [Prometheus](https://prometheus.io/).

## Exported metrics

We have chosen to mainly focus on events changes, so it defaults to be enabled.

But all available inventory can too be published.

## Run and command-line options

The exporter can be run with following command:

```sh
    # node /path/to/src/index.js [options]
```

With known options being:

- `-k`, `--key`: provide the Jeedom API key, defaulting to none

- `-p`, `--port`: set the listening port, used by Prometheus when scraping the metrics, defaulting to 9124

- `-c`, `--config`: define the path to your custom YAML configuration file

- `-v`, `--verbose`: when set, runs verbosely.

## Configuration

With the exception of the Jeedom API key for which no default value is provided, and so MUST be defined either in your custom configuration file or as a command-line option, all other configuration options have acceptable defaults. Only specify in your custom configuration file the options you want override.

The default configuration is:

```yaml
    prometheus:
        port: 9124                                      # the Prometheus scraping port
        prefix: 'jeedom_'                               # a prefix to be prepended to all published metrics
        metrics: '/metrics'                             # the metrics scraping route
    jeedom:
        url: 'http://127.0.0.1/core/api/jeeApi.php'     # the Jeedom JSON RPC API URL
        key: null                                       # the Jeedom API key
    exporter:
        # we keep in memory an array of requests timings as computed by got
        #  each item is about 450 bytes
        #  do not leave this array grow until being too big to be kept manageable
        timings:
            limit: 10000                                # size is limited to ~4.3MB
            remove: 100                                 # we remove items by range of 100 each time it is needed
    # the requesters configurations
    # defaulting to only be interested by event changes which are requested every minute
    requesters:
        cmd:                                            # the commands inventory
            refresh:
                enabled: false
                interval: 3600000                       # 1h
        eqLogic:                                        # the equipments inventory
            refresh:
                enabled: false
                interval: 3600000
        event:                                          # the events changes
            changes:
                enabled: true
                interval: 60000                         # 1mn = 60 x 1000 ms
                since: 600000                           # when starting, rewind 10mn to init the metrics
        interaction:                                    # the interactions inventory
            refresh:
                enabled: false
                interval: 3600000
        jeeObject:                                      # the jeeObject inventory
            inventory:                                  # this rather targets the full in-memory inventory, is not published as metrics
                interval: 3600000
            refresh:                                    # this instead is used for publishing an inventory as metrics
                enabled: false
                interval: 3600000
        plugin:                                         # the plugins inventory
            daemon:                                     # daemon informations: doesn't provide any relevant result as of v1.0.0
                info:
                    refresh:
                        enabled: false
                        interval: 3600000
            list:                                       # the plugins list
                refresh:
                    enabled: false
                    interval: 3600000
        scenario:                                       # the scenarii inventory
            refresh:
                enabled: false
                interval: 3600000
        summary:                                        # the summary inventory
            refresh:
                enabled: false
                interval: 3600000
        system:                                         # the system inventory, only USB mappings as of v1.0.0
            refresh:
                enabled: false
                interval: 3600000
```

## systemd example

An exemple of `.service` file is provided in `maintainer/` directory:

```
[Unit]
Description=Jeedom Prometheus Exporter
After=network.target

[Service]
WorkingDirectory=/opt/jeedom_exporter
ExecStart=node /opt/jeedom_exporter/src/index.js --config /etc/prometheus/jeedom-exporter.yml
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---
P. Wieser
- Last updated on 2025, Jan. 30th
