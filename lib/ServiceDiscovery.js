var util = require('util')
var Service = require('./Service')
var semver = require('semver')
var debug = require('debug')('galaxya_ServiceDiscovery')
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
		// for right now
		this._lookupImmediately(version, callback)

		// for future discoveries
		galaxya[emitterMethod](this._name, internalCallback(galaxya, version, callback))
	}
}

ServiceDiscovery.prototype._lookupImmediately = function (version, callback) {

	var results = this._galaxya.lookupService(this._name, version)

	for (var i = 0; i < results.length; i++)
		fireAsyncEvent(results[i], callback)
}

function internalCallback(galaxya, version, userCallback) {

	return function internal(service) {
		var serviceOk = galaxya._filterFailed([ service ])

		if (version)
			serviceOk = serviceOk && galaxya._gtOrEq(service.version, version)

		if (serviceOk)
			userCallback(service)
	}
}

function fireAsyncEvent(service, callback) {
	setImmediate(function immediate() {
		callback(service)
	})
}

ServiceDiscovery.prototype.on = function(type, version, callback) {
	this._proxy('on', type, version, callback)
}

ServiceDiscovery.prototype.once = function(type, version, callback) {
	this._proxy('once', type, version, callback)
}