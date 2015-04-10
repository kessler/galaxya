# Galaxya [![Build Status](https://secure.travis-ci.org/kessler/galaxya.png?branch=master)](http://travis-ci.org/kessler/galaxya)

embeddable peer 2 peer service discovery and configuration service

Galaxya helps one process or machine discover another, using [gossip](https://github.com/kessler/grapevine)

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

#### client.js
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
		service.on('fail', function () {	})
		service.on('alive', function () { })
	})

	// this also works
	galaxya.discoverService('foo', function(err, service) {
		// will be fired EACH TIME a 'foo' service will be discovered
		// as this might be unconventional, in the future we might change this so it will be called 
		// only in the first discovery.
	})
})

```

#### namespacing
```javascript
	// service1.js
	galaxya.registerService({
		name: 'foo/bar/moo',
		port: 1234
	})

	galaxya.registerService({
		name: 'foo/bar',
		port: 1234
	})

	// serviceClient.js
	var discovery = galaxya.discoverService('foo/bar')

	discovery.on('available', function(service) {
		// fires twice, once for foo/bar and once for foo/bar/moo
	})

```


TODO
* document the 1 to many mapping between gossiper to services topology
* add auto network space assignment
* is trie really the right structure for the underlying index?
* allow for gossiper per machine architecture
* discoverService callback, first time only or always?
* add consensus algorithm
