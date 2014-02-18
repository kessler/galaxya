var Galaxya = require('../lib/Galaxya.js')
var EventEmitter = require('events').EventEmitter
var assert = require('assert')
var inspect = require('eyes').inspector()

function gossiper(port) {
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
		var mockGossiper = gossiper(2324)
		var g1 = galaxy(mockGossiper)
		var key = g1.addService('myservice', '1.1.1', { port: 123 })

		assert.deepEqual(key.path, ['service', 'myservice', '1.1.1', '127.0.0.1', '2324', process.pid.toString()])

		assert.ok(key.id in mockGossiper.state)

		assert.deepEqual(mockGossiper.state[key], [ { address: '127.0.0.1', port: 123, lease: undefined } , undefined ])
	})

	it('can be queries for services', function () {

		var mockGossiper = gossiper(2324)
		var g1 = galaxy(mockGossiper)
		var key = g1.addService('myservice', '1.1.1', { port: 123 })

		console.log(g1.getService('myservice'))
		console.log(g1._index.get('service/myservice'))
	})

})