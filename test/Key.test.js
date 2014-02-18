var Key = require('../lib/Key.js')
var assert = require('assert')

describe('Key', function () {
	it('is created from an array', function () {
		var key = new Key(['a', 'b', 'c'])

		assert.deepEqual(key.path, ['a', 'b', 'c'])
	})

	it('will throw an exception path is missing', function () {
		assert.throws(function () {
			new Key()
		})
	})

	it('will throw an exception path is empty', function () {
		assert.throws(function () {
			new Key([])
		})
	})

	it('toString() method is vital - it is used in lookups in hashes and once called caches the result', function () {
		var key = new Key(['a', 'b', 'c'])

		assert.strictEqual(key.id, undefined)
		assert.strictEqual(key.toString(), 'a/b/c')
		assert.strictEqual(key.id, 'a/b/c')
	})

	describe('can be created from strings', function () {
		it('by specifying path separator and one or more arguments', function () {
			var key = Key.fromString('/', '1/2/3')
			assert.deepEqual(key.path, ['1', '2', '3'])
		})

		it('will return nothing if string is missing', function () {
			assert.strictEqual(Key.fromString(), undefined)
		})

		it('will return nothing if string is empty', function () {
			assert.strictEqual(Key.fromString(''), undefined)
		})
	})
})