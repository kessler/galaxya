module.exports = dontInjectGenerateStars

function random(start, end) {
	var range = end - start;
	return Math.floor((Math.random() * range) + start);
}

function Star(probability, graphics) {
	this.probability = probability
	this.graphics = graphics
	this.events = 0
}

Star.prototype.update = function () {
//	this.events--
}

Star.prototype.draw = function(canvas, x, y) {
	canvas[y][x] = this.graphics
	return 1
}

function Ship(probability, graphics, count) {
	this.events = 0
	this.count = count
	this.probability = probability
	this.originalProbability = probability
	this.graphics = graphics
	this.drawCount = 0
	this.y = -1
}

Ship.prototype.draw = function (canvas, x, y) {

	for (var i = 0; i < this.graphics.length && x + i < canvas[y].length; i++) {
		canvas[y][x + i] = this.graphics[i]
	}

	return this.graphics.length
}

Ship.prototype.update = function () {

}


function dontInjectGenerateStars(height, width) {

	var stars = [
		new Star(0.9224, ' '),
		new Star(0.05, '.'),
		new Star(0.01, 'o'),
		new Star(0.005, 'O'),
		new Star(0.005, '*'),
		new Star(0.005, '+'),
		new Star(0.002, '@'),
		new Ship(0.0003, ' (-|o|-) ', 2),
		new Ship(0.0001, '-|-', 1),
		new Ship(0.0002, ' <--{ ', 3)
	]

	stars.sort(function(a, b) {
		return b.probability - a.probability
	})

	var events = height * width

	var x = 0

	for (var i = 0; i < stars.length; i++) {
		var star = stars[i]
		x += star.probability
		star.count = 0
		star.pRange = 1 - star.probability
		star.events = Math.ceil(events * (star.probability))
	}

	stars.sort(function(a, b) {
		return b.pRange - a.pRange
	})

	var canvas = []

	for (var h = 0; h < height; h++) {
		canvas.push( new Array(width) )

		for (var w = 0; w < width;) {

			var p = Math.random()

			for (var i = 0; i < stars.length; i++) {
				var star = stars[i]

				if (p > star.pRange) {
					star.count++
					var r = star.draw(canvas, w, h)

					w += r > 0 ? r : 1
					star.update()

					// if (star.count === star.events)
					//  	stars.splice(i, 1)

					break
				}
			}
		}

		canvas[h].push('\n')
	}

	// for (var i = 0; i < stars.length; i++) {
	// 	var star = stars[i]
	// 	console.log(star.graphics, star.events, star.count)
	// }

	var result = ''
	for (var h = 0; h < canvas.length; h++) {
		result += canvas[h].join('')
	}
	return result
}

if (require.main === module) {
	console.log(dontInjectGenerateStars(30, 80))
}