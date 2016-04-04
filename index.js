var grapevine = require('grapevine')
var Galaxya = require('./lib/Galaxya.js')

module.exports = function (config) {

	config = config || {}

	if (config.port === undefined) {
		config.port = 25120
	}

	if (config.address === undefined) {
		config.address = '127.0.0.1'
	}

	var gossiper = new grapevine.Gossiper(config)
	return new Galaxya(gossiper)
}

module.exports.Galaxya = Galaxya

