var Trie = require('./Trie')
var Key = require('./Key')
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

	this._pathSeparator = '/'

	this._gossiper = gossiper

	var index =	this._index = new Trie()

	var self = this

	this._gossiper.on('update', gossipUpdate)
	this._gossiper.on('expired', gossipExpire)
	this._gossiper.on('peer_alive', gossipPeerAlive)
	this._gossiper.on('peer_failed', gossipPeerFailed)

	function gossipUpdate(peer, k, v, ttl) {
		debug('gossip update [%s]', k)

		if (ttl && ttl < Date.now())
			return;

		var key = Key.fromString(self._pathSeparator, k)

		if (!key) {
			return debug('illegal key %s', k)
		}

		if (key.path[0] === 'service' && key.path.length > 2) {
			try {
				var service = self._newService(v)
				self.registerService(service, true)
			} catch (e) {
				debug('error updating remote service %s', util.inspect(e))
			}
		} else {
			self.emit(key.path[0], new Message(key, v, ttl))
		}
	}

	function gossipExpire(expired) {
		for (var i = 0; i < expired.length; i++) {
			var rawKey = expired[i]

			// TODO uncomment when implementation is done
			//index.remove(Key.fromString(k, self._pathSeparator).path)
			self.emit('expired', rawKey)
		}
	}

	function gossipPeerAlive (peer) {
		debug('peer alive %s', peer.name)
		self.emit(peer.name + ' alive')
	}

	function gossipPeerFailed (peer) {
		debug('peer failed %s', peer.name)
		self.emit(peer.name + ' failed')
	}
}

Galaxya.prototype.start = function(callback) {
	var self = this
	this._gossiper.start(function () {
		callback(null, self)
	})
}

Galaxya.prototype.save = function (message) {
	this._index.put(message.key.path, message.value)
	this._gossiper.setLocalState(message.key.toString(), message.value, message.ttl)
}

//TODO add escape for separators
Galaxya.prototype.registerService = function(serviceData, remote) {

	if (!serviceData.address)
		serviceData.address = serviceData.address || this._gossiper.address

	if (!serviceData.gossiper)
		serviceData.gossiper = this._gossiper.peer_name

	var service = this._newService(serviceData)

	// its a little wasteful to duplicate data both in the key and the value, but it makes life easier
	var key = new Key(['service', service.name, service.version, service.address, service.port], this._pathSeparator)

	var existing = this._index.searchByPrefix(key.path, true)

	if (existing.length > 0) {
		debug('discarding service %s@%s[%s:%s] regisration because it already exists', service.name, service.version, service.address, service.port)
		return key
	}

	var rawKey = key.toString()

	debug('adding service %s', rawKey)

	this._index.put(key.path, service)

	if (!remote)
		this._gossiper.setLocalState(rawKey, serviceData, service.ttl)

	this._fireServiceRegistered(service)

	return key
}

Galaxya.prototype.lookupService = function(name, version) {
	if (!name)
		throw new Error('must supply a name')

	var key = new Key(['service', name], this._pathSeparator)

	debug('lookup services %s', key.path)

	var results = this._index.searchByPrefix(key.path, true)

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
 * @param {String} [version] a semver compatible version of the service
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
	var eventName = Service.eventName(this._pathSeparator, service.name)
	setImmediate(function (){
		self.emit(eventName, service)
	})
}

function Message(k, v, ttl) {
	this.key = k
	this.value = v
	this.ttl = ttl
}