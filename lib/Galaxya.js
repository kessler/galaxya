var Trie = require('digital-tree')
var debug = require('debug')('galaxya')
var EventEmitter = require('events').EventEmitter
var util = require('util')
var semver = require('semver')
var assert = require('assert')
var Service = require('./Service.js')
var ServiceDiscovery = require('./ServiceDiscovery.js')

module.exports = Galaxya

util.inherits(Galaxya, EventEmitter)
function Galaxya(gossiper) {
	EventEmitter.call(this)

	this.setMaxListeners(0)

	this._gossiper = gossiper

	var index =	this._index = new Trie()

	var self = this

	this._failedPeers = {}
	this._failedPeersCount = 0

	this._gossiper.on('update', gossipUpdate)
	this._gossiper.on('expire', gossipExpire)
	this._gossiper.on('peer_alive', gossipPeerAlive)
	this._gossiper.on('peer_failed', gossipPeerFailed)

	function gossipUpdate(peer, k, v, ttl) {
		debug('gossip update [%s]', k)

		// service keys are [namespace,,, version, ip, port]
		try {
			var service = self._newService(v)
			self.register(service.key, service, self._isLocalService(service))
		} catch (e) {
			debug('error creating remote service %s', util.inspect(e))
			self.emit('error', e)
		}
	}

	function gossipExpire(peer, k, v, ttl) {
		debug('expiring %s', k)
		index.remove(k.split('/'))
		self.emit(k + ' expire', v, ttl)
	}

	function gossipPeerAlive (peer) {
		debug('peer alive %s', peer)
		self._failedPeersCount--
		delete self._failedPeers[peer]
		self.emit(peer + ' alive')
	}

	function gossipPeerFailed (peer) {
		debug('peer failed %s', peer)
		self._failedPeersCount++
		self._failedPeers[peer] = true
		self.emit(peer + ' fail')
	}
}

Galaxya.prototype.start = function(callback) {
	var self = this
	this._gossiper.start(function () {
		callback(null, self)
	})
}

Galaxya.prototype.registerService = function(serviceData) {

	if (!serviceData.address)
		serviceData.address = this._gossiper.address

	if (!serviceData.gossiper)
		serviceData.gossiper = this._gossiper.peer_name

	var service = this._newService(serviceData)

	return this.register(service.key, service, this._isLocalService(service))
}

Galaxya.prototype.register = function (key, data, saveLocally) {

	var existing = this._index.searchByPrefix(key, true)

	if (existing.length > 0) {
		debug('not registerting %s because it already exists', key)

		return key
	}

	debug('registering %s', key)

	this._index.put(key, data)

	if (saveLocally) {
		this._gossiper.setLocalState(data.rawKey, data, data.ttl)
	}

	this._fireRegisterEvent(key, data)

	return key
}

Galaxya.prototype._isLocalService = function(service) {
	return service.gossiper === this._gossiper.peer_name
}

/**
 * query available services
 *
 * @param {String} name the name of the service
 * @param {String} [version] return services greater or equal to this version
 *
 * @returns {Array} an array of services matching the query
 */
Galaxya.prototype.lookup = Galaxya.prototype.lookupService = function(name, version) {
	if (!name)
		throw new Error('must supply a name')

	var key = name.split('/')

	debug('lookup services %s', key)

	var results = this._index.searchByPrefix(key, true)

	results.sort(sort)

	if (version) {
		results = filterGtOrEq(version, results)
	}

	if (this._failedPeersCount > 0)
		results = this._filterFailed(results)

	return results
}

function gtOrEq(versionA, versionB) {
	return semver.satisfies(versionA, '>=' + versionB)
}

Galaxya.prototype._gtOrEq = gtOrEq

/**
 * slice a services array by version
 *
 * @param {String} version the min version of the service
 * @param {Array} services an array of services sorted from high to low version
 *
 */
function filterGtOrEq(version, services) {
	for (var i = services.length - 1; i >= 0; i--) {
		if (gtOrEq(services[i].version, version))
			break
	}

	return services.slice(0, i + 1)
}

Galaxya.filterGtOrEq = filterGtOrEq

function sort(a, b) {
	assert.ok(a)
	assert.ok(b)

	return semver.lt(a.version, b.version)
}

Galaxya.prototype._filterFailed = function(services) {
	var results = []
	for (var i = services.length - 1; i >= 0; i--) {
		var service = services[i]

		if (!(service.gossiper in this._failedPeers))
			results.push(service)
	}

	return results
}

/**
 * A service is discoverable in the future using an event emitter
 *
 * @param {String} name the name of the service
 *
 */
Galaxya.prototype.discover = Galaxya.prototype.discoverService = function(name, callback) {
	if (!name)
		throw new Error('must specify a service name')

	var discovery = new ServiceDiscovery(this, name)

	if (callback) {
		
		if (typeof callback !== 'function') {
			throw new Error('invalid second parameter must be a callback function')
		}

	 	discovery.on('available', discoveryEventToCallback(callback))
	}

	return discovery
}

function discoveryEventToCallback(cb) {
	return function adapter(service) {
		cb(null, service)
	}
}

Galaxya.prototype._newService = function(data) {
	return new Service(data, this)
}

Galaxya.prototype._fireRegisterEvent = function(key, data) {
	var current = ''

	for (var i = 0, len = key.length; i < len; i++) {
		if (i > 0)
			current += '/'

		current += key[i]

		this.emit(current, data)
	}
}

function Message(k, v, ttl) {
	this.key = k
	this.value = v
	this.ttl = ttl
}