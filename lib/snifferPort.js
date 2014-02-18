module.exports = function(findPort, callback) {
	findPort(25100, 25200, function(ports) {
		if (ports && ports.length > 0)
			callback(null, ports[0])
		else
			callback('no ports')
	})
}