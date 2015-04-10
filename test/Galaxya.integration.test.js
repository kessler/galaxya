var grapevine = require('grapevine')
var assert = require('assert')
var Galaxya = require('../lib/Galaxya.js')

describe('integration test', function () {
	var g1, g2, gossiper1, gossiper2

	it('gossips', function (done) {
		this.timeout(10000)

		var discovery = g2.discoverService('myservice')

		discovery.on('available', function (service) {
			assert.strictEqual(service.version, '0.0.0')
			assert.strictEqual(service.name, 'myservice')
			assert.strictEqual(service.port, '2512')
			assert.strictEqual(service.address, '127.0.0.1')
			done()
		})

		g1.registerService({
			name: 'myservice',
			port: '2512'
		})
	})

	it('reports failed peers', function (done) {
		this.timeout(25000)
		var discovery = g2.discoverService('myservice')

		discovery.on('available', function (service) {
			var g1Stopped = false
			
			service.on('fail', function () {
				assert.ok(g1Stopped)
				done()
			})

			gossiper1.stop(function () {
				g1Stopped = true
			})
		})

		g1.registerService({
			name: 'myservice',
			port: '2512'
		})
	})

	it('expire services', function (done) {
		this.timeout(20000)
		g2.on('myservice/0.0.0/127.0.0.1/2512 expire', function (v, ttl) {
			done()
		})

		g1.registerService({
			name: 'myservice',
			port: '2512',
			ttl: Date.now() + 5000
		})
	})

	beforeEach(function (done) {
		gossiper1 = new grapevine.Gossiper({ port: 25120, seeds: ['127.0.0.1:25121'] })
		gossiper2 = new grapevine.Gossiper({ port: 25121 })
		g1 = new Galaxya(gossiper1)
		g2 = new Galaxya(gossiper2)

		g1.start(function(err) {
			if (err) return done(err)

			g2.start(function (err) {
				if (err) return done(err)

				done()
			})
		})
	})

	afterEach(function (done) {
		gossiper1.stop(function (err) {
			gossiper2.stop(function (err) {
				done()
			})
		})
	})
})