var grapevine = require('grapevine')
var Galaxya = require('./lib/Galaxya.js')

module.exports = function (config) {

	config = config || {}

	config.port = config.port || 25120

	config.address = config.address || '127.0.0.1'

	var gossiper = new grapevine.Gossiper(config.port, config.seeds, config.address)
	return new Galaxya(gossiper)
}

module.exports.Galaxya = Galaxya

