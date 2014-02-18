var grapevine = require('grapevine')
var Galaxya = require('./lib/Galaxya.js')

module.exports = function (config) {
	var gossiper = new grapevine.Gossiper(config.port, config.seeds, config.address)
	return new Galaxya(gossiper)
}

module.exports.Galaxya = Galaxya

