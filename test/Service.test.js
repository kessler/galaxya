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

	it('fires a failed event when peer fails', function (done) {

		service.on('failed', done)

		galaxya.emit(peer + ' failed')
	})

	it('fires an alive event when a peer is alive', function (done) {

		service.on('alive', done)

		galaxya.emit(peer + ' alive')
	})
})