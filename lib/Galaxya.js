var Trie = require('./Trie')
var Key = require('./Key')
var debug = require('debug')('galaxya')
var EventEmitter = require('events').EventEmitter
var util = require('util')

module.exports = Galaxya

util.inherits(Galaxya, EventEmitter)
function Galaxya(gossiper) {
	EventEmitter.call(this)

	this._pathSeparator = '/'

	this._gossiper = gossiper

	var index =	this._index = new Trie()

	var self = this

	this._gossiper.on('update', gossipUpdate)
	this._gossiper.on('expired', gossipExpire)

	function gossipUpdate(k, v, ttl) {

		if (ttl && ttl < Date.now())
			return;

		var key = self._newKey(k)

		if (!key.isValid()) {
			return debug('illegal key %s', k)
		}

		index.put(key.path, v)

		self.emit(key.id, new Message(key, v, ttl))
	}

	function gossipExpire(expired) {
		for (var i = 0; i < expired.length; i++) {
			var key = self._newKey(expired[i])
			index.del(key.path)
			self.emit('expired', key)
		}
	}
}

Galaxya.prototype.getService = function(name, version) {
	var key = ['service', name]
	if (version)
		key.push(version)

	key = key.join(this._pathSeparator)

	debug('getting service %s', key)

	return this._index.get([name, version].join(this._pathSeparator))
}

//TODO add escape for separators
Galaxya.prototype.addService = function(name, version, service, lease) {
	if (!service)
		throw new Error('missing service data (simple hash)')

	if (!service.port)
		throw new Error('must specify a port')

	service.port = service.port.toString()

	// this might still be undefined though, its completely optional
	if (!service.lease)
		service.lease = lease

	// not sure I want to do this
	// if (service.port === this._gossiper.port)
	// 	throw new Error('cannot publish a service with gossiper port')

	service.address = service.address || this._gossiper.address

	var key = Key.fromArgs(this._pathSeparator, 'service', name, version, this._gossiper.address, this._gossiper.port, process.pid)

	debug('adding service %s, %s', key.id, util.inspect(service))

	this._index.put(key.id, service)

	this._gossiper.setLocalState(key.id, service, service.lease)

	return this._newKey(key.id)
}

Galaxya.prototype.set = function (key, value) {

	this._gossiper.setLocalState(key, value)
}

Galaxya.prototype.get = function(key) {
	return this._gossiper.getLocalState(key)
}

Galaxya.prototype.search = function(prefix) {
	//return this._index.
	throw new Error('not implemented')
}

Galaxya.prototype._newKey = function(rawKey) {
	return new Key(rawKey, this._pathSeparator)
}

function Message(k, v, ttl) {
	this.key = k
	this.value = v
	this.ttl = ttl
}