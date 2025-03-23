# prometheus-jeedom-exporter

## ZWave events

As of 1.2.x we can observe that ZWave events can change the displayed 'unit' value:

- when the device is off, we get raw_unit='W' and unit='W'
- when the device is on and power is greater than some hundred of watts, the unit becomes 'kW'.

From Prometheus point of view, this creates two distinct time series because labels are different.

Starting with v2, we take the following modifications:

- have only cmd_id, method, name, humanName, alertLevel labels
- unit and raw_unit labels are no more set.

## Releasing

The release is made through the 'NPM Node.js Package' GitHub action (to be automated), which packs and publishes to [NPMJS](https://www.npmjs.com) registry.

Though the tags are rightly named as in  `git tag -am "Releasing v 1.2.3" 1.2.3`, versions hould be named with a `v` prefix.
