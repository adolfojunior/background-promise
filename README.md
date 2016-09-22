# Background Promise

A simple cache that will load the value on demand.
During a load process, if the cache receive multiples requests, it will push it to a queue, and trigger all with the response when the request receive the response.

## Options
- `load(resolve, reject) {...}` : Function used to load a new value *required*
- `immediate`: Should load the value in background during the creation. (true | false)
- `ttl`: Time in millis, that will keep the value. If it expires, the first `get()` call will load a new one.
- `interval`: Time in millis that will load a new value in background.
- `promise`: Promise type that should be used internally to create all promises.

## Methods

- `get()`: Return a `Promise` to the value.
- `getLast()`: Return a `Promise` to the value, and avoid the queue, return the last loaded value!
- `update()`: Force an update on the cache.
- `isExpired()`: What the name says!

### Simple example
```javascript
import backgroundPromise from 'background-promise'

const content = backgroundPromise({
  load(resolve, reject) {
    setTimeout(() => {
      resolve(Math.random())
    }, 1000)
  }
})

// the first call will trigger the executor to resolve the number
content.get().then(number => { ... })
// Will go to the queue and wait for the same response
content.get().then(number => { ... })

// after 1 second
content.get().then(number => { ... })
```

## Example to cache a request
```javascript
import request from 'request'
import backgroundPromise from 'background-promise'

const content = backgroundPromise({
  ttl: 30000, // live for 30 seconds
  interval: 300000, // each 5 minutes it will auto update
  load(resolve, reject) {
    request('https://api.github.com/repos/adolfojunior/background-promise', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body)
      } else {
        reject(response.statusCode)
      }
    })
  }
})

// the first call will trigger the executor to resolve the request
content.getLast().then(body => { ... })

// Will always get the last loaded content!
// if it is expired, it will trigger the update before the interval
content.getLast().then(body => { ... })

// Will get the cached content!
content.getLast().then(body => { ... })

```

