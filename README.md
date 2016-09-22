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

`get()`: Return a `Promise` to the value.
`update()`: Force an update on the cache.
`isExpired()`: What the name says!

### Simple example
```javascript
import backgroundPromise from 'background-promise'

const content = backgroundPromise({
  load(resolve, reject) {
    resolve(Math.random())
  }
})

// the first call will trigger the executor to resolve the number
content.get().then(number => { ... })

// Will get the cached content if available,
// or will wait in the queue for the same request below
content.get().then(number => { ... })

// Will get the cached content!
content.get().then(number => { ... })

```

## Example to cache a request
```javascript
import request from 'request'
import backgroundPromise from 'background-promise'

const content = backgroundPromise({
  load(resolve, reject) {
    request('https://api.github.com/repos/adolfojunior/background-promise', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        resolve(body)
      } else {
        reject()
      }
    })
  }
})

// the first call will trigger the executor to resolve the content
content.get().then(body => { ... })

// Will get the cached content if available,
// or will wait in the queue for the same request below
content.get().then(body => { ... })

// Will get the cached content!
content.get().then(body => { ... })

```

If the content take to long to execute, there is also an option to
