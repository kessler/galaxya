# Galaxya

embeddable peer 2 peer service discovery and configuration service

## Example

start galaxya from command line (starts on port 25120)
#### seed
```
npm install -g galaxya

> galaxya
```

#### service1.js
```javascript
var galaxya = require('galaxya')({ seeds: [ '127.0.0.1:25120' ] })
galaxya.start(function () {
	galaxya.registerService({
		port: 12345,
		name: 'foo',
		version: '1.0.0',
		data: {
			my: 'service',
			data: 1
		}
	})
})
```

#### service2.js
```javascript
var galaxya = require('galaxya')({ port: 25121, seeds: [ '127.0.0.1:25120' ] }})
galaxya.start(function () {
	galaxya.registerService({
		port: 1234,
		name: 'foo',
		version: '0.0.6',
		data: {
			my: 'service',
			data: 1
		}
	})
})
```

// client.js
```javascript
var galaxya = require('galaxya')({port: 25123, seeds: [ '127.0.0.1:25122' ]})

galaxya.start(function () {

	var services = galaxya.lookupService('foo', '0.0.5')

	//services might be
	// [
	// 		{ port: 12345, name: 'foo', version: '1.0.0', data: { my: 'service', data: 1 }},
	//		{ port: 12345, name: 'foo', version: '0.0.6', data: { my: 'service', data: 1 }}
	// ]

	// discover new foo services
	var discovery = galaxya.discoverService('foo')

	discovery.on('available', function (service) {
		// notify on all foo services
	})

	discovery.on('available', '0.0.3' function (service) {
		// notify on versions equal or higher than 0.0.3
		service.on('failed', function () {	})
		service.on('alive', function () { })
	})
})

```

TODO
* document the 1 to many mapping between gossiper to services topology
* add auto network space assignment