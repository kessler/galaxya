var debug = require('debug')('Trie')

module.exports = Trie

function Trie() {
	this._data = {}
}

Trie.prototype.put = function (key, value) {
	debug('put([%s], [%s])', key, value)
	var current = this._data

	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			current[node] = {}

		current = current[node]
	}

	current.$ = value
}

Trie.prototype.remove = function (key) {

	// var current = this._data

	// for (var i = 0; i < key.length; i++) {
	// 	var node = key[i]

	// 	if (current[node] === undefined)
	// 		current[node] = {}

	// 	current = current[node]
	// }

	// current['@'] = value

	throw new Error('need to implement')
}

Trie.prototype.get = function(key) {
	debug('get([%s]', key)
	var current = this._data

	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			return undefined

		current = current[node]
	}

	return current.$
}

Trie.prototype.search = function(key) {
	debug('search([%s])', key)

	var results = []

	var current = this._data


	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			return results

		current = current[node]
	}

	this._collect(key, current, results)

	return results
}

Trie.prototype._collect = function(path, parent, results) {
	if (!parent) return;

	for (var k in parent) {
		if (k === '$') {
			results.push([path.concat([]), parent.$])
			continue
		}

		var current = parent[k]

		this._collect(path.concat([k]), current, results)
	}
}