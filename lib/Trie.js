var debug = require('debug')('trie')

module.exports = Trie

function Trie() {
	this._data = {}
}

Trie.prototype.put = function (key, value) {
	debug('put( {%s}, {%s} )', key, value)
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
	debug('remove( {%s} )', key)

	var current = this._data
	var parent

	// find the path, if its not found return
	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			return

		parent = current
		current = current[node]
	}

	if (parent)
		delete parent[key[key.length - 1]]
}

Trie.prototype.get = function(key) {
	debug('get( {%s} )', key)
	var current = this._data

	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			return undefined

		current = current[node]
	}

	return current.$
}

Trie.prototype.searchByPrefix = function(key, excludeKeys) {
	debug('search( {%s} )', key)

	var results = []

	var current = this._data

	for (var i = 0; i < key.length; i++) {
		var node = key[i]

		if (current[node] === undefined)
			return results

		current = current[node]
	}

	this._searchByPrefixCollect(key, current, results, excludeKeys)

	return results
}

Trie.prototype._searchByPrefixCollect = function(path, parent, results, excludeKeys) {
	if (!parent) return;

	for (var k in parent) {
		if (k === '$') {

			if (excludeKeys)
				results.push(parent.$)
			else
				results.push([path.concat([]), parent.$])

			continue
		}

		var current = parent[k]

		this._searchByPrefixCollect(path.concat([k]), current, results, excludeKeys)
	}
}