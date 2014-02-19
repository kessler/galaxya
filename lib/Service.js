var semver = require('semver')

module.exports = Service

function Service(data, galaxya) {
	if (!data)
		throw new Error('missing service data (simple hash)')

	if (!data.name)
		throw new Error('missing service name')

	this.name = data.name

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

	Object.defineProperty(this, "_galaxya", {
		value: galaxya
		,enumerable: false
	});

}

Service.prototype._proxy = function(emitterMethod, event, callback) {

	var galaxya = this._galaxya

	if (!galaxya) throw new Error('zzz')

	if (event === 'alive') {
		galaxya[emitterMethod](this.gossiper + ' alive', callback)
	} else if (event === 'failed') {
		galaxya[emitterMethod](this.gossiper + ' failed', callback)
	}
}

Service.prototype.on = function(type, callback) {
	this._proxy('on', type, callback)
}

Service.prototype.once = function(type, callback) {
	this._proxy('once', type, callback)
}

Service.eventName = function(pathSeparator, name) {
	return 'service' + pathSeparator + name
}