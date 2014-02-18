var util = require('util')

module.exports = Key

var DEFAULT_PATH_SEPARATOR = '/'

function Key(path, pathSeparator) {
	if (!path)
		throw new Error('invalid or empty path')

	if (path.length === 0)
		throw new Error('invalid or empty path')

	this.pathSeparator = pathSeparator || DEFAULT_PATH_SEPARATOR
	this.path = path
	this.id = undefined
}

Key.prototype.toString = function () {
	if (!this.id)
		this.id = this.path.join(this.pathSeparator)

	return this.id
}

Key.fromString = function(pathSeparator, string) {
	if (!string)
		return

	if (string.length === 0)
		return

	var key = new Key(string.split(pathSeparator), pathSeparator)
	key.id = string

	return key
}