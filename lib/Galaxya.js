var Trie = require('./Trie')
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

	this._gossiper.on('update', gossipUpdate)
	this._gossiper.on('expire', gossipExpire)
	this._gossiper.on('peer_alive', gossipPeerAlive)
	this._gossiper.on('peer_failed', gossipPeerFailed)

	function gossipUpdate(peer, k, v, ttl) {
		debug('gossip update [%s]', k)

		// service keys are [namespace,,, version, ip, port]
		try {
			var service = self._newService(v)
			self._registerService(service)
		} catch (e) {
			debug('error creating remote service %s', util.inspect(e))
		}
	}

	function gossipExpire(peer, k, v, ttl) {
		debug('expiring %s', k)
		index.remove(k.split('/'))
		self.emit(k + ' expire', v, ttl)
	}

	function gossipPeerAlive (peer) {
		debug('peer alive %s', peer)
		self.emit(peer + ' alive')
	}

	function gossipPeerFailed (peer) {
		debug('peer failed %s', peer)
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

	return this._registerService(service)
}

Galaxya.prototype._registerService = function (service) {

	var key = service.key

	var existing = this._index.searchByPrefix(key, true)

	if (existing.length > 0) {
		debug('not registerting service %s@%s[%s:%s](%s) because it already exists',
			service.name, service.version, service.address, service.port, service.ttl || 0)

		return key
	}

	debug('registering service %s@%s[%s:%s](%s)', service.name, service.version, service.address, service.port, service.ttl || 0)

	this._index.put(key, service)

	if (service.gossiper === this._gossiper.peer_name) {
		this._gossiper.setLocalState(service.rawKey, service, service.ttl)
	}

	this._fireServiceRegistered(service, key)

	return key
}

/**
 * query available services
 *
 * @param {String} name the name of the service
 * @param {String} [version] return services greater or equal to this version
 *
 * @returns {Array} an array of services matching the query
 */
Galaxya.prototype.lookupService = function(name, version) {
	if (!name)
		throw new Error('must supply a name')

	var key = name.split('/')

	debug('lookup services %s', key)

	var results = this._index.searchByPrefix(key, true)

	results.sort(sort)

	if (version) {
		results = filterGtOrEq(version, results)
	}

	return results
}

/**
 * A service is discoverable in the future using an event emitter
 *
 * @param {String} name the name of the service
 *
 */
Galaxya.prototype.discoverService = function(name) {
	if (!name)
		throw new Error('must specify a service name')

	return new ServiceDiscovery(this, name)
}

function gtOrEq(versionA, versionB) {
	return semver.satisfies(versionA, '>=' + versionB)
}

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

Galaxya.prototype._newService = function(data) {
	return new Service(data, this)
}

Galaxya.prototype._fireServiceRegistered = function(service) {
	var self = this

	var key = service.key

	var current = ''

	for (var i = 0, len = key.length; i < len; i++) {
		if (i > 0)
			current += '/'

		current += key[i]

		setImmediate(eventEmit(this, current, service))
	}
}

function eventEmit(galaxya, event, service) {
	return function () {
		galaxya.emit(event, service)
	}
}

function Message(k, v, ttl) {
	this.key = k
	this.value = v
	this.ttl = ttl
}