var darkmagic = require('darkmagic')
var ip = require('ip')

module.exports = function (config, callback) {

	config = config || {}

	config.address = config.address || ip.address()
	config.port = config.port || 25120

	darkmagic.inject(main, {
		config: config
	})

	function main(gossiper, Galaxya, debug) {

		debug = debug('galaxya_index')

		var galaxya = new Galaxya(config, gossiper)
	}
}

module.exports.Galaxya = require('./lib/Galaxya.js')

