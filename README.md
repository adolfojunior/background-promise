# Background Promise

- Cache
- Self update with Interval
- Queue of promises to wait the same result

```javascript
import request from 'request'

const content = new BackgroundPromise((resolve, reject) => {
  request('https://api.github.com/repos/adolfojunior/background-promise', function (error, response, body) {
    if (!error && response.statusCode == 200) {
      resolve(body)
    } else {
      reject()
    }
  })
})

// the first call will trigger the executor to resolve the content
content.get().then(body => { ... })

// Will get the cached content if available,
// or will wait in the queue for the same request below
content.get().then(body => { ... })

// Will get the cached content!
content.get().then(body => { ... })

```

```javascript
const content = new BackgroundPromise((resolve, reject) => {
  resolve(Math.random())
}, {
  // the promise should try to resolve the content immediatly
  immediate: false, // default to false, it will be on demand
  // interval that will make a auto-refresh on the promise
  interval: 0, // default, will refresh when the content is requested
  // control the cache time, in millis
  ttl: 60 * 000, // default to 1 minute
  // Promise constructor used internally
  promise: Promise
})

// the first call will trigger the executor to resolve the content
content.get().then(number => { ... })

// Will get the cached content if available,
// or will wait in the queue for the same request below
content.get().then(number => { ... })

// Will get the cached content!
content.get().then(number => { ... })

```
