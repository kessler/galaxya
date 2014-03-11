var semver = require('semver')

module.exports = Service

function Service(data, galaxya) {
	if (!data)
		throw new Error('missing service data (simple hash)')

	if (!data.name)
		throw new Error('missing service name')

	this.name = data.name

	if (data.namespace)
		this.namespace = data.namespace

	if (!data.port)
		throw new Error('missing service port')

	this.port = data.port.toString()

	if (!data.address)
		throw new Error('missing service address')

	this.address = data.address

	if (!data.gossiper)
		throw new Error('missing gossiper')

	/* the original gossiper from which this service came */
	this.gossiper = data.gossiper

	this.version = data.version || '0.0.0'

	if (!semver.valid(this.version))
		throw new Error('invalid version ' + this.version)

	this.data = data.data || {}

	if (data.ttl)
		this.ttl = data.ttl

	// properties that will not get serialized when sent through gossip

	Object.defineProperty(this, '_galaxya', {
		value: galaxya,
		enumerable: false
	})

	var self = this
	Object.defineProperty(this, 'key', {
		get: function g() {
			return self._key()
		},
		enumerable: false
	})

	Object.defineProperty(this, 'rawKey', {
		get: function g() {
			return self._key().join('/')
		},
		enumerable: false
	})
}

Service.prototype._key = function() {

	var key = this.name.split('/')

	if (this.namespace)
		key = this.namespace.split('/').concat(key)

	key.push(this.version)
	key.push(this.address)
	key.push(this.port)

	return key
}

Service.prototype._proxy = function(emitterMethod, event, callback) {

	var galaxya = this._galaxya

	if (event === 'alive') {
		galaxya[emitterMethod](this.gossiper + ' alive', callback)
	} else if (event === 'fail') {
		galaxya[emitterMethod](this.gossiper + ' fail', callback)
	} else if (event === 'expire') {
		galaxya[emitterMethod](this.rawKey + ' expire', callback)
	}
}

Service.prototype.on = function(type, callback) {
	this._proxy('on', type, callback)
}

Service.prototype.once = function(type, callback) {
	this._proxy('once', type, callback)
}