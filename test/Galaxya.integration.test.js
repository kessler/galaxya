var grapevine = require('grapevine')
var assert = require('assert')
var Galaxya = require('../lib/Galaxya.js')

describe('integration test', function () {
	it('gossips', function (done) {
		this.timeout(10000)

		var gossiper1 = new grapevine.Gossiper(25120, ['127.0.0.1:25121'])
		var gossiper2 = new grapevine.Gossiper(25121)
		var g1 = new Galaxya(gossiper1)
		var g2 = new Galaxya(gossiper2)

		g1.start(function () {
			g2.start(function () {

				var discovery = g2.discoverService('myservice')

				discovery.on('available', function (service) {
					assert.strictEqual(service.version, '0.0.0')
					assert.strictEqual(service.name, 'myservice')
					assert.strictEqual(service.port, '2512')
					assert.strictEqual(service.address, '127.0.0.1')

					gossiper1.stop()
					gossiper2.stop()
					done()
				})

				g1.registerService({
					name: 'myservice',
					port: '2512'
				})
			})
		})
	})

	it('reports failed peers', function (done) {
		this.timeout(25000)

		var gossiper1 = new grapevine.Gossiper(25120, ['127.0.0.1:25121'])
		var gossiper2 = new grapevine.Gossiper(25121)
		var g1 = new Galaxya(gossiper1)
		var g2 = new Galaxya(gossiper2)

		g1.start(function () {
			g2.start(function () {

				var discovery = g2.discoverService('myservice')

				discovery.on('available', function (service) {

					service.on('fail', function () {
						gossiper2.stop()
						done()
					})

					gossiper1.stop()
				})

				g1.registerService({
					name: 'myservice',
					port: '2512'
				})
			})
		})
	})

	it('expire services', function (done) {
		this.timeout(20000)

		var gossiper1 = new grapevine.Gossiper(25120, ['127.0.0.1:25121'])
		var gossiper2 = new grapevine.Gossiper(25121)
		var g1 = new Galaxya(gossiper1)
		var g2 = new Galaxya(gossiper2)

		g1.start(function () {
			g2.start(function () {
				g2.on('myservice/0.0.0/127.0.0.1/2512 expire', function (v, ttl) {
					gossiper1.stop()
					gossiper2.stop()
					done()
				})

				g1.registerService({
					name: 'myservice',
					port: '2512',
					ttl: Date.now() + 5000
				})
			})
		})
	})

	it('does not advertise services on failed galaxies', function (done) {
		this.timeout(25000)

		var gossiper1 = new grapevine.Gossiper(25120, ['127.0.0.1:25121'])
		var gossiper2 = new grapevine.Gossiper(25121)
		var g1 = new Galaxya(gossiper1)
		var g2 = new Galaxya(gossiper2)

		g1.start(function () {
			g2.start(function () {

				var discovery = g2.discoverService('myservice')

				discovery.on('available', function (service) {

					service.on('fail', function () {
						gossiper2.stop()
						done()
					})

					gossiper1.stop()
				})

				g1.registerService({
					name: 'myservice',
					port: '2512'
				})
			})
		})
	})
})