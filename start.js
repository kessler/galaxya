var config = {
	port: 25120
}

require('./index')(config, function (galaxya) {
	console.log(galaxya)
})