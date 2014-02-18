#!/usr/bin/env node
var argv = require('optimist')
.option('sniff', {})
.argv

var rc = require('rc')

var config = rc('galaxya', {
	port: 25120,
	address: '127.0.0.1'
}, argv)

if (argv.sniff) {
	require('darkmagic').inject(require('../lib/sniffer'), {
		config: config
	})
} else {
	require('../index')(config, function (galaxya) {
		console.log('galaxya started')
	})
}
