var debug = require('debug')('galaxya_gossip')
module.exports = function(config, grapevine) {
	return new grapevine.Gossiper(config.port, config.seeds, config.address)
}