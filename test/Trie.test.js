var Trie = require('../lib/Trie.js')
var assert = require('assert')

describe('Trie', function () {

	var trie

	beforeEach(function () {
		trie = new Trie()
		trie.put(['a', 'b', 'c'], 'data')
		trie.put(['a', 'b', 'd'], 'data1')
		trie.put(['a'], 'data2')
		trie.put(['a', 'd'], 'data3')
	})

	it('put()', function () {

		assert.strictEqual(typeof trie._data['a'], 'object')
		assert.strictEqual(typeof trie._data['a']['b'], 'object')
		assert.strictEqual(typeof trie._data['a']['b']['c'], 'object')
		assert.strictEqual(typeof trie._data['a']['b']['d'], 'object')
		assert.strictEqual(trie._data['a']['b']['c'].$, 'data')
		assert.strictEqual(trie._data['a']['b']['d'].$, 'data1')
	})

	it('get()', function () {
		assert.strictEqual(trie.get(['a', 'b', 'c']), 'data')
	})

	it('doesnt get()', function () {
		assert.strictEqual(trie.get(['a', 'b']), undefined)
	})

	it('_collect()', function () {
		var results = []
		var path = ['a', 'b']
		trie._searchByPrefixCollect(path, trie._data['a']['b'], results)

		assert.deepEqual(results[0], [['a', 'b', 'c'], 'data'])
		assert.deepEqual(results[1], [['a', 'b', 'd'], 'data1'])
	})

	it('can be searched', function () {
		var results = trie.searchByPrefix(['a', 'b'])

		assert.deepEqual(results[0], [['a', 'b', 'c'], 'data'])
		assert.deepEqual(results[1], [['a', 'b', 'd'], 'data1'])
	})

	it('can be searched and results will not include keys, just data', function () {
		var results = trie.searchByPrefix(['a', 'b'], true)

		assert.deepEqual(results[0], 'data')
		assert.deepEqual(results[1], 'data1')
	})

	it('wont return results if prefix does not exist', function () {
		var results = trie.searchByPrefix(['a', 'l'])

		assert.strictEqual(results.length, 0)
	})
})