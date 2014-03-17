var Galaxya = require('../lib/Galaxya.js')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var inspect = require('eyes').inspector()

function newGossiper(port) {
	var emitter = new EventEmitter()

	emitter.port = port
	emitter.address = '127.0.0.1'
	emitter.peer_name = '127.0.0.1:' + port
	emitter.state = {}
	//emitter._isLocalService = Galaxya.prototype._isLocalService

	emitter.setLocalState = function (k, v, ttl) {
		this.state[k] = [v, ttl]
	}
	emitter.start = function () {
	}

	return emitter
}

function galaxya(gossiper) {
	return new Galaxya(gossiper)
}

describe('Galaxya', function () {

	it('store services in a local index', function () {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)
		var s1 = { name:'myservice', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var key = g1.registerService(s1)

		assert.deepEqual(key, ['myservice', '1.1.1', '127.0.0.1', '123'])

		var rawKey = key.join('/')

		assert.ok(rawKey in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[rawKey], [ s1, undefined ])
	})

	it('store services with name spaces', function () {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)
		var s1 = { name:'myservice/namespace1/namespace2', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}
		var key = g1.registerService(s1)

		assert.deepEqual(key, ['myservice', 'namespace1', 'namespace2', '1.1.1', '127.0.0.1', '123'])

		var rawKey = key.join('/')

		assert.ok(rawKey in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[rawKey], [ s1, undefined ])
	})

	it('can be queries for services', function () {

		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)

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
		var g1 = galaxya(mockGossiper)

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
		var g1 = galaxya(mockGossiper)

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

	describe('services can be discovered', function () {
		it('after they were registered', function (done) {
			var mockGossiper = newGossiper(2324)
			var g1 = galaxya(mockGossiper)

			var s1 = { name:'s1/sub1', version: '1.1.1', port: 123, data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

			g1.registerService(s1)

			var discovery = g1.discover('s1')

			discovery.on('available', function (service) {
				assert.deepEqual(service, s1)
				done()
			})
		})

		it('by listening for future events', function (done) {
			var mockGossiper = newGossiper(2324)
			var g1 = galaxya(mockGossiper)

			var s1 = { name:'s1/sub1', version: '1.1.1', port: 123, address: '127.0.0.1', data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

			var discovery = g1.discover('s1')

			discovery.on('available', function (service) {
				assert.deepEqual(service, s1)
				done()
			})

			mockGossiper.emit('update', '127.0.0.1:2324', 's1/sub1/1.1.1/127.0.0.1/123', s1)
		})

		it('by using  callback', function (done) {
			var mockGossiper = newGossiper(2324)
			var g1 = galaxya(mockGossiper)

			var s1 = { name:'s1/sub1', version: '1.1.1', port: 123, address: '127.0.0.1', data: { moo: 'pie' }, gossiper: '127.0.0.1:2324'}

			var discovery = g1.discover('s1', function (err, service) {
				assert.deepEqual(service, s1)
				done()
			})

			mockGossiper.emit('update', '127.0.0.1:2324', 's1/sub1/1.1.1/127.0.0.1/123', s1)
		})
	})

	it('registers a service from gossip', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)

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
		var g1 = galaxya(mockGossiper)

		var s1 = { name:'moo', address: '127.0.0.1', version: '1.1.1', port: '1234', data: { moo: 'pie' }}

		g1.registerService(s1)

		assert.strictEqual(g1.lookupService('moo').length, 1)

		mockGossiper.emit('expire', {}, 'moo/1.1.1/127.0.0.1/1234')

		assert.strictEqual(g1.lookupService('moo').length, 0)

		done()
	})

	describe('maintains a record of failed peers', function () {
		it('adds a peer to the record when it fails', function () {
			var mockGossiper = newGossiper(2324)
			var g1 = galaxya(mockGossiper)

			var peer = '127.0.0.5:2313'

			mockGossiper.emit('peer_failed', peer)

			assert.ok('127.0.0.5:2313' in g1._failedPeers)
		})

		it('removes a peer when it comes back to life', function () {
			var mockGossiper = newGossiper(2324)
			var g1 = galaxya(mockGossiper)

			var peer = '127.0.0.5:2313'

			mockGossiper.emit('peer_failed', peer)

			mockGossiper.emit('peer_alive', peer)

			assert.ok(!('127.0.0.5:2313' in g1._failedPeers))
		})
	})

	it('emits an event when a peer fails', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)

		var peer = '127.0.0.5:2313'

		g1.on('127.0.0.5:2313 fail', done)

		mockGossiper.emit('peer_failed', peer)
	})

	it('emits an event when a peer is alive', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxya(mockGossiper)

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