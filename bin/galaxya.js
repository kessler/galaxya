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
	console.log(require('./generateGalaxyArt.js')(25, 80))

	if (typeof config === 'function') {
		callback = config
		config = undefined
	}

	var galaxya = require('../index')(config)

	galaxya.start(function() {
		console.log('galaxya started on port %s', config.port)
	})
}
