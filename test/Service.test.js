var Service = require('../lib/Service.js')
var assert = require('assert')

var EventEmitter = require('events').EventEmitter

describe('Service', function () {

	var galaxya
	var service
	var peer = '127.0.0.1:123'

	beforeEach(function() {
		galaxya = new EventEmitter()
		galaxya._pathSeparator = '/'

		service = new Service({ gossiper: peer, name: '123', port: '123', address: '123' }, galaxya)
	})

	it('fires a failed event when peer a fails', function (done) {

		service.on('fail', done)

		galaxya.emit(peer + ' fail')
	})

	it('fires an alive event when a peer is alive', function (done) {

		service.on('alive', done)

		galaxya.emit(peer + ' alive')
	})

	describe('generates a key based on the data of the service', function() {

		it('key changes with data', function () {
			assert.deepEqual(service.key, ['123', '0.0.0', '123', '123'])
			service.name = '1233444'
			assert.deepEqual(service.key, ['1233444', '0.0.0', '123', '123'])
		})

		it('rawKey changes with data', function () {
			assert.deepEqual(service.rawKey, '123/0.0.0/123/123')
			service.name = '1233444'
			assert.deepEqual(service.rawKey, '1233444/0.0.0/123/123')
		})

		it('rawKey is just a joined view of key', function () {
			assert.strictEqual(service.key.join('/'), service.rawKey)
		})

		it('if a namespace is specified it will be included in the key', function () {

			service.namespace = 'abcd'

			assert.strictEqual(service.rawKey, 'abcd/123/0.0.0/123/123')
		})
	})
})