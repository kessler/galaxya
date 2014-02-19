var ServiceDiscovery = require('../lib/ServiceDiscovery.js')
var assert = require('assert')

var EventEmitter = require('events').EventEmitter



describe('ServiceDiscovery', function () {

	var galaxya
	var serviceDiscovery

	beforeEach(function() {
		galaxya = new EventEmitter()
		galaxya._pathSeparator = '/'

		serviceDiscovery = new ServiceDiscovery(galaxya, 'foo')
	})

	it('fires an available event when galaxya registers a new event', function (done) {

		var s1 = { version: '1.1.1' }

		serviceDiscovery.on('available', function(service) {
			assert.strictEqual(service, s1)
			done()
		})

		galaxya.emit('service/foo', s1)
	})

	it('allows registration to services with minimum version', function (done) {

		var s1 = { version: '1.1.2' }

		serviceDiscovery.on('available', '1.1.1', function(service) {
			assert.strictEqual(service, s1)
			done()
		})

		galaxya.emit('service/foo', s1)
	})

	it('will not trigger version specific registration when version is lower', function (done) {

		var s1 = { version: '1.1.0' }

		serviceDiscovery.on('available', '1.1.1', function(service) {
			done('should not happen')
		})

		galaxya.emit('service/foo', s1)

		// WARNING: this test will not work if emitting will become really asynchronous for some reason
		done()
	})
})