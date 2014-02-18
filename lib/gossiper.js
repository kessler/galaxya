var debug = require('debug')('galaxya_gossip')
module.exports = function(config, grapevine, callback) {
	var gossiper = new grapevine.Gossiper(config.port, config.seeds, config.address)

	gossiper.on('started', function() {
		debug('gossip started...')
		callback(null, gossiper)
	})

	gossiper.start()
}