var Galaxya = require('../lib/Galaxya.js')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var inspect = require('eyes').inspector()
var grapevine = require('grapevine')

function newGossiper(port) {
	var emitter = new EventEmitter()

	emitter.port = port
	emitter.address = '127.0.0.1'
	emitter.peer_name = '127.0.0.1:' + port
	emitter.state = {}
	emitter.setLocalState = function (k, v, ttl) {
		this.state[k] = [v, ttl]
	}
	emitter.start = function () {
	}

	return emitter
}

function galaxy(gossiper) {
	return new Galaxya(gossiper)
}

describe('Galaxya', function () {

	it('store services in a local index', function () {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)
		var s1 = { name:'myservice', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var key = g1.registerService(s1)

		assert.deepEqual(key, ['myservice', '1.1.1', '127.0.0.1', '123'])

		var rawKey = key.join('/')

		assert.ok(rawKey in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[rawKey], [ s1, undefined ])
	})

	it('store services with name spaces', function () {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)
		var s1 = { name:'myservice/namespace1/namespace2', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var key = g1.registerService(s1)

		assert.deepEqual(key, ['myservice', 'namespace1', 'namespace2', '1.1.1', '127.0.0.1', '123'])

		var rawKey = key.join('/')

		assert.ok(rawKey in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[rawKey], [ s1, undefined ])
	})

	it('can be queries for services', function () {

		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'s1/sub1/sub2', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var s2 = { name:'s1/sub1/sub2', version: '1.1.2', port: 124, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var s3 = { name:'s1/sub2/sub3', version: '1.1.3', port: 124, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

		g1.registerService(s1)
		g1.registerService(s2)
		g1.registerService(s3)

		var results = g1.lookupService('s1', '1.1.1')

		assert.strictEqual(results.length, 3)

		assert.deepEqual(results[1], s2)
		assert.deepEqual(results[0], s3)

		results = g1.lookupService('s1/sub1', '1.1.1')

		assert.strictEqual(results.length, 2)

		assert.deepEqual(results[1], s1)
		assert.deepEqual(results[0], s2)
	})

	it('emits events based on service namespace when a service is registered', function (done) {

		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'s1/sub1', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

		var count = 0

		function emitCheck(service) {

			assert.deepEqual(service, s1)

			if (++count === 5)
				done()
		}

		g1.on('s1', emitCheck)

		g1.on('s1/sub1', emitCheck)

		g1.on('s1/sub1/1.1.1', emitCheck)

		g1.on('s1/sub1/1.1.1/127.0.0.1', emitCheck)

		g1.on('s1/sub1/1.1.1/127.0.0.1/123', emitCheck)

		g1.registerService(s1)
	})

	it('emits a service event only once for service with the same version from the same machine and port', function (done) {

		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'s1/sub1', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

		var emits = []


		g1.emit = function() {
			emits.push(arguments)
		}

		g1.registerService(s1)
		g1.registerService(s1)

		setImmediate(function () {
			assert.strictEqual(emits.length, 5)
			assert.strictEqual(emits[0][0], 's1')
			assert.strictEqual(emits[1][0], 's1/sub1')
			assert.strictEqual(emits[2][0], 's1/sub1/1.1.1')
			assert.strictEqual(emits[3][0], 's1/sub1/1.1.1/127.0.0.1')
			assert.strictEqual(emits[4][0], 's1/sub1/1.1.1/127.0.0.1/123')
			done()
		})
	})

	it('registers a service from gossip', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'moo/pie', address: '127.0.0.1', version: '1.1.1', port: '1234', data: { moo: 'pie' }, gossiper: '127.0.0.1:25123'}

		assert.strictEqual(g1.lookupService('moo/pie').length, 0)

		mockGossiper.emit('update', '127.0.0.1:25123', 'moo/pie/1.1.1/127.0.0.1/1234', s1)

		var results = g1.lookupService('moo/pie')
		assert.strictEqual(results.length, 1)
		assert.deepEqual(results[0], s1)
		done()
	})

	it('expires a service from gossip', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'moo', address: '127.0.0.1', version: '1.1.1', port: '1234', data: { moo: 'pie' }}

		g1.registerService(s1)

		assert.strictEqual(g1.lookupService('moo').length, 1)

		mockGossiper.emit('expire', {}, 'moo/1.1.1/127.0.0.1/1234')

		assert.strictEqual(g1.lookupService('moo').length, 0)

		done()
	})

	it('emits an event when a peer fails', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var peer = '127.0.0.5:2313'

		g1.on('127.0.0.5:2313 fail', done)

		mockGossiper.emit('peer_failed', peer)
	})

	it('emits an event when a peer is alive', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var peer = '127.0.0.5:2313'

		g1.on('127.0.0.5:2313 alive', done)

		mockGossiper.emit('peer_alive', peer)
	})

	it('filter util - when its there', function () {
		var services = [
			{ version : '1.1.3'},
			{ version : '1.1.2'},
			{ version : '1.1.1'}
		]

		services = Galaxya.filterGtOrEq('1.1.2', services)
		assert.strictEqual(services.length, 2)

		assert.strictEqual(services[0].version, '1.1.3')
		assert.strictEqual(services[1].version, '1.1.2')
	})

	it('filter util - when it aint', function () {
		var services = [
			{ version : '1.1.1'},
			{ version : '1.1.0'},
			{ version : '1.0.1'}
		]

		services = Galaxya.filterGtOrEq('1.1.2', services)
		assert.strictEqual(services.length, 0)
	})
})

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