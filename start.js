var config = {
	port: 25120
}

require('./index')(config, function () {
	console.log(1)
})