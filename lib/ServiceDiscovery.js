var util = require('util')
var Service = require('./Service')
var semver = require('semver')

module.exports = ServiceDiscovery

function ServiceDiscovery(galaxya, name) {

	this._galaxya = galaxya
	this._name = name
	this._eventName = Service.eventName(galaxya._pathSeparator, name)
}

ServiceDiscovery.prototype._proxy = function(emitterMethod, event, version, callback) {

	if (typeof version === 'function') {
		callback = version
		version = undefined
	}

	var galaxya = this._galaxya

	if (event === 'available') {

		if (version) {
			callback = filteringCallback(version, callback)
		}

		galaxya[emitterMethod](this._eventName, callback)
	}
}

function filteringCallback(version, userCallback) {

	return function (service) {
		if (semver.satisfies(service.version, '>=' + version)) {
			userCallback(service)
		}
	}
}

ServiceDiscovery.prototype.on = function(type, version, callback) {
	this._proxy('on', type, version, callback)
}

ServiceDiscovery.prototype.once = function(type, version, callback) {
	this._proxy('once', type, version, callback)
}