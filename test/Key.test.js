var Key = require('../lib/Key.js')
var assert = require('assert')

describe('Key', function () {
	it('is created from a string', function () {
		var key = new Key('a/b/c')

		assert.strictEqual(key.id, 'a/b/c')
		assert.deepEqual(key.path, ['a', 'b', 'c'])
		assert.ok(key.isValid())
	})

	it('is only valid if path is specified properly', function () {
		var key = new Key('')
		assert.ok(!key.isValid())
	})

	it('toString() method is vital - it is used in lookups in hashes - extra is not included', function () {
		var key = new Key('a/b/c')
		assert.strictEqual(key.toString(), 'a/b/c')
	})

	describe('can be created from arguments', function () {
		it('by specifying path separator and one or more arguments', function () {
			var key = Key.fromArgs('/', 1, 2, 3)
			assert.strictEqual(key.toString(), '1/2/3')
		})

		it('will throw an exception if not enough arguments are used', function () {
			assert.throws(function () {
				Key.fromArgs()
			})
		})
	})
})