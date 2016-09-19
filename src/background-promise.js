const ONE_MINUTE_MILLIS = 60 * 1000

const required = (reason) => {throw new Error(reason)}

export default class BackgroundPromise {
  constructor(executor = required(`executor can't be null`), {
    ttl,
    // TODO: add a timeout to wait in the queue
    timeout,
    immediate,
    promiseClass
  } = {}) {
    this.promiseClass = promiseClass || Promise
    this.executor = executor
    this.updating = null
    this.content = null
    this.lastUpdate = 0
    this.ttl = (ttl === undefined) ? ONE_MINUTE_MILLIS : ttl
    // auto load the content
    if (immediate === true) {
      this.update()
    }
  }

  isExpired() {
    return (Date.now() - this.lastUpdate) > this.ttl
  }

  get({ wait } = {}) {
    if (this.content === null) {
      return this.update()
    } else if (this.isExpired()) {
      const promise = this.update()
      if (wait !== false) {
        return promise
      }
    }
    return this.value()
  }

  value() {
    return this.promiseClass.resolve(this.content && this.content.value)
  }

  update() {
    return new (this.promiseClass)((resolve, reject) => {
      this.pushUpdate(resolve, reject)
    })
  }

  pushUpdate(resolve, reject) {
    if (this.updating === null) {
      const updating = this.executeUpdate()
      this.updating = updating
      this.updating.promise.then(() => {
        // clear if is the current update in progress
        if (this.updating === updating) {
          this.updating = null
        }
      })
    }
    // TODO: limit to the queue
    // it hit the limit, resolve the promise with the current value
    this.updating.queue.push({
      resolve,
      reject
    })
  }

  executeUpdate() {
    const time = Date.now()
    const queue = []
    const promise = new (this.promiseClass)(this.executor)
      .then(value => {
        this.onUpdate(queue, value)
      }, error => {
        this.onUpdateError(queue, error)
      })
    return { time, queue, promise }
  }

  onUpdate(queue, value) {
    this.content = { value }
    this.lastUpdate = Date.now()
    // trigger the update
    queue.forEach((promise) => {
      try {
        promise.resolve && promise.resolve(value)
      } catch (e) {
        promise.reject && promise.reject(e)
      }
    })
  }

  onUpdateError(queue, error) {
    // keep the last content
    queue.forEach((promise) => {
      try {
        promise.reject && promise.reject(error)
      } catch (e) {
        // wat?
      }
    })
  }
}
