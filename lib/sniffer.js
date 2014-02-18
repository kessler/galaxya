module.exports = function (config, snifferPort, grapevine, optimist, util, callback) {

	var gossiper = new grapevine.Gossiper(snifferPort, [ config.address + ':' + config.port ], '127.0.0.1')

	gossiper.on('update', function(peer, k, v, ttl) {
		console.log('%s => %s: %s (%d)', peer, k, util.inspect(v), ttl ? ttl : 0)
	})

	gossiper.start(function () {
		callback(null)
	})

}

