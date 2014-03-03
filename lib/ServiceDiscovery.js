var util = require('util')
var Service = require('./Service')
var semver = require('semver')

module.exports = ServiceDiscovery

function ServiceDiscovery(galaxya, name) {

	this._galaxya = galaxya
	this._name = name
}

ServiceDiscovery.prototype._proxy = function(emitterMethod, event, version, callback) {

	if (typeof version === 'function') {
		callback = version
		version = undefined
	}

	var galaxya = this._galaxya

	if (event === 'available') {

		this._lookupAvailableImmediately(version, callback)

		if (version) {
			callback = filteringCallback(version, callback)
		}

		galaxya[emitterMethod](this._name, callback)
	}
}

function filteringCallback(version, userCallback) {

	return function (service) {
		if (semver.satisfies(service.version, '>=' + version)) {
			userCallback(service)
		}
	}
}

ServiceDiscovery.prototype._lookupAvailableImmediately = function (version, callback) {

	var results = this._galaxya.lookupService(this._name, version)

	for (var i = 0; i < results.length; i++)
		queue(results[i], callback)
}

function queue(service, callback) {
	setImmediate(function () {
		callback(service)
	})
}

ServiceDiscovery.prototype.on = function(type, version, callback) {
	this._proxy('on', type, version, callback)
}

ServiceDiscovery.prototype.once = function(type, version, callback) {
	this._proxy('once', type, version, callback)
}