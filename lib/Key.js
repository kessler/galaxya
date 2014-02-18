var util = require('util')

module.exports = Key

var DEFAULT_PATH_SEPARATOR = '/'

function Key(raw, pathSeparator) {

	this.id = raw

	if (this.id)
		this.path = this.id.split(pathSeparator || DEFAULT_PATH_SEPARATOR)
}

Key.prototype.isValid = function(first_argument) {
	return this.id && this.path && this.path.length > 0
}

Key.prototype.toString = function () {
	return this.id
}

Key.fromArgs = function(pathSeparator) {
	if (!pathSeparator)
		throw new Error('missing pathSeparator')

	if (arguments.length < 2)
		throw new Error('must supply atleast one argument in addition to the path separator')

	var raw = ''

	for (var i = 1; i < arguments.length; i++) {
		if (i > 1)
			raw += pathSeparator

		raw += arguments[i]
	}

	return new Key(raw, pathSeparator)
}