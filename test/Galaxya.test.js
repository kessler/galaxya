var Galaxya = require('../lib/Galaxya.js')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var inspect = require('eyes').inspector()
var grapevine = require('grapevine')

function newGossiper(port) {
	var emitter = new EventEmitter()

	emitter.port = port
	emitter.address = '127.0.0.1'
	emitter.state = {}
	emitter.setLocalState = function (k, v, ttl) {
		this.state[k] = [v, ttl]
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
		var s1 = { name:'myservice', version: '1.1.1', port: 123, data: { moo: 'pie' }}
		var key = g1.registerService(s1)

		assert.deepEqual(key.path, ['service', 'myservice', '1.1.1', '127.0.0.1', '123'])

		assert.ok(key.id in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[key], [ s1, undefined ])
	})

	it('can be queries for services', function () {

		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'myservice', version: '1.1.1', port: 123, data: { moo: 'pie' }}
		var s2 = { name:'myservice', version: '1.1.2', port: 124, data: { moo: 'pie' }}
		var s3 = { name:'myservice', version: '1.1.3', port: 124, data: { moo: 'pie' }}

		var e1Called = false
		//var e2Called = false

		g1.once('service/myservice', function () {
			e1Called = true
		})

		// g1.once('service/myservice/1.1.1', function () {
		// 	e2Called = true
		// })

		g1.registerService(s1)
		g1.registerService(s2)
		g1.registerService(s3)

		var results = g1.lookupService('myservice', '1.1.1')

		assert.strictEqual(results.length, 3)

		assert.deepEqual(results[1], s2)
		assert.deepEqual(results[0], s3)

		assert.ok(e1Called)
		//assert.ok(e2Called)
	})

	it('can be waited for services to become available', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'myservice', version: '1.1.1', port: 123, data: { moo: 'pie' }}
		var s2 = { name:'myservice', version: '1.1.2', port: 123, data: { moo: 'pie' }}
		var s3 = { name:'myservice', version: '1.1.3', port: 123, data: { moo: 'pie' }}

		g1.waitForService('myservice', '1.1.2', function(service) {
			assert.deepEqual(service, s2)
			done()
		})

		g1.registerService(s1)
		g1.registerService(s2)
	})

	it('registers a service from gossip', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'moo', address: '127.0.0.1', version: '1.1.1', port: '1234', data: { moo: 'pie' }}

		assert.strictEqual(g1.lookupService('moo').length, 0)

		mockGossiper.emit('update', '127.0.0.1:25123', 'service/moo/1.1.1/127.0.0.1/1234', s1)

		var results = g1.lookupService('moo')
		assert.strictEqual(results.length, 1)
		assert.deepEqual(results[0], s1)
		done()
	})

	it.skip('expires a service from gossip', function (done) {
		var mockGossiper = newGossiper(2324)
		var g1 = galaxy(mockGossiper)

		var s1 = { name:'moo', address: '127.0.0.1', version: '1.1.1', port: '1234', data: { moo: 'pie' }}


		mockGossiper.emit('expire', ['service/moo/1.1.1/127.0.0.1/1234'])

	})

	it('filter util - when its there', function () {
		var services = [
			{ version : '1.1.3'},
			{ version : '1.1.2'},
			{ version : '1.1.1'}
		]

		services = Galaxya.filterServices('1.1.2', services)
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

		services = Galaxya.filterServices('1.1.2', services)
		assert.strictEqual(services.length, 0)
	})
})

describe('integration test', function () {
	it('', function (done) {
		this.timeout(10000)
		var gossiper2, gossiper1

		gossiper1 = new grapevine.Gossiper(25120, ['127.0.0.1:25121'])
		gossiper1.start(function () {
			gossiper2 = new grapevine.Gossiper(25121)
			gossiper2.start(function () {

				var g1 = new Galaxya(gossiper1)
				var g2 = new Galaxya(gossiper2)

				g1.registerService({
					name: 'myservice',
					port: '2512'
				})


				g2.waitForService('myservice', function (service) {
					assert.strictEqual(service.version, '0.0.0')
					assert.strictEqual(service.name, 'myservice')
					assert.strictEqual(service.port, '2512')
					assert.strictEqual(service.address, '127.0.0.1')

					gossiper1.stop()
					gossiper2.stop()
					done()
				})
			})
		})
	})
})