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

#### client1.js
```javascript
var galaxya = require('galaxya')({port: 25122, seeds: [ '127.0.0.1:25121' ]})

galaxya.start(function () {
	var results = galaxya.lookupService('foo', '0.0.5')

	//results might be
	// [
	// 		{ port: 12345, name: 'foo', version: '1.0.0', data: { my: 'service', data: 1 }},
	//		{ port: 12345, name: 'foo', version: '0.0.6', data: { my: 'service', data: 1 }}
	// ]
})

```

// client2.js
```javascript
var galaxya = require('galaxya')({port: 25123, seeds: [ '127.0.0.1:25122' ]})

galaxya.start(function () {
	// will get called when this node gets notified about a foo service with version >= 0.0.5
	galaxya.waitForService('foo', '0.0.5', function (service) {
		galaxya.onServiceActivity(service, function(status) {
			if(!status.alive) {
				console.log('%s failed', service.name)
			}
		})
	})
})

```
_note: this api might change so the events will be registered on the service instance_

TODO
* document the 1 to many mapping between gossiper to services topology
