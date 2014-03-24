var ServiceDiscovery = require('../lib/ServiceDiscovery.js')
var assert = require('assert')
var Galaxya = require('../lib/Galaxya.js')
var EventEmitter = require('events').EventEmitter

describe('ServiceDiscovery', function () {

	var galaxya
	var serviceDiscovery

	beforeEach(function() {
		galaxya = new EventEmitter()
		galaxya._pathSeparator = '/'
		galaxya.lookupService = function () {
			return this._results || []
		}

		galaxya._gtOrEq = Galaxya.prototype._gtOrEq

		galaxya._filterFailed = function(service) {
			return service
		}

		serviceDiscovery = new ServiceDiscovery(galaxya, 'foo')
	})

	it('fires an available event when galaxya registers a new event', function (done) {

		var s1 = { version: '1.1.1' }

		serviceDiscovery.on('available', function(service) {
			assert.strictEqual(service, s1)
			done()
		})

		galaxya.emit('foo', s1)
	})

	it('when registering the available event, fire (almost) immediately for existing services', function (done) {

		var s1 = { version: '1.1.1' }

		galaxya._results = [ s1 ]

		serviceDiscovery.on('available', function(service) {
			assert.strictEqual(service, s1)
			done()
		})
	})

	it('allows registration to services with minimum version', function (done) {

		var s1 = { version: '1.1.2' }

		serviceDiscovery.on('available', '1.1.1', function(service) {
			assert.strictEqual(service, s1)
			done()
		})

		galaxya.emit('foo', s1)
	})

	it('will not trigger version specific registration when version is lower', function (done) {

		var s1 = { version: '1.1.0' }

		serviceDiscovery.on('available', '1.1.1', function(service) {
			done('should not happen')
		})

		galaxya.emit('foo', s1)

		// WARNING: this test will not work if emitting will become really asynchronous for some reason
		done()
	})
})