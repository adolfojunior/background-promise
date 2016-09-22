const required = (reason) => {throw new Error(reason)}

class BackgroundPromise {
  constructor(options = required(`options can't be null`)) {
    const {
      load,
      ttl,
      interval,
      immediate,
      promiseType
    } = options
    // load function that will be passed as a executor to a Promise
    this.load = load || required(`load function can't be null`)
    // the last cached content { data }
    this.content = null
    // the promise type that should be used (bluebird?)
    this.promiseType = promiseType || Promise
    // time to live of content! In millis.
    this.ttl = ttl || 0
    // interval to auto update. In millis.
    this.interval = interval || 0
    // reference to the current timer that is executing a update.
    this.scheduledInterval = null
    // current update queue and promise { time, queue }
    this.currentUpdate = null
    // time of the last update to check expiration.
    this.lastUpdate = 0
    // check if it should immetiate load, or should schedule an update.
    if (immediate) {
      this.update()
    } else if (interval) {
      this.scheduleUpdate()
    }
  }

  isExpired() {
    if (this.ttl) {
      return (Date.now() - this.lastUpdate) > this.ttl
    }
    return true
  }

  get(options = {}) {
    if (!this.content) {
      // console.log(`# first load`, this.content)
      return this.update()
    } else if (this.isExpired()) {
      // console.log(`# content has expired`)
      const promise = this.update()
      if (options.wait !== false) {
        // console.log(`# will wait`)
        return promise
      }
    }
    // console.log(`# will value`)
    return this.value()
  }

  rawValue() {
    return this.content && this.content.value
  }

  value() {
    return this.promiseType.resolve(this.rawValue())
  }

  update() {
    return new (this.promiseType)((resolve, reject) => {
      this.pushUpdate(resolve, reject)
    })
  }

  pushUpdate(resolve, reject) {
    if (!this.currentUpdate) {
      this.executeUpdate()
    }
    // TODO: limit to the queue
    // it hit the limit, resolve the promise with the current value
    this.currentUpdate.queue.push({
      resolve,
      reject
    })
    // console.log(`# pushUpdate added to queue`, this.currentUpdate.queue)
  }

  scheduleUpdate() {
    if (this.scheduledInterval) {
      clearTimeout(this.scheduledInterval)
    }
    if (this.interval) {
      this.scheduledInterval = setTimeout(() => {
        // console.log(`# scheduledInterval`)
        this.scheduledInterval = null
        // if there is no update running, then do it!
        if (!this.currentUpdate) {
          this.update()
        }
      }, this.interval)
      // detach the timer in node
      if (this.scheduledInterval.unref) {
        this.scheduledInterval.unref()
      }
    }
  }

  executeUpdate() {
    // console.log(`# create promise to update`)
    const event  = {
      time: Date.now(),
      queue: []
    }
    // keep the current update!
    this.currentUpdate = event
    // create a promise
    new (this.promiseType)(this.load)
      .then(value => {
        this.onUpdate(event, value)
      }, error => {
        this.onUpdateError(event, error)
      })
  }

  onUpdate(event, value) {
    this.content = { value }
    this.lastUpdate = Date.now()
    // then trigger all in the queue
    event.queue.forEach((promise) => {
      try {
        promise.resolve && promise.resolve(value)
      } catch (e) {
        try {
          promise.reject && promise.reject(error)
        } catch (e) {
          // wat?
        }
      }
    })
    this.releaseUpdate(event)
  }

  onUpdateError(event, error) {
    // then trigger all in the queue
    event.queue.forEach((promise) => {
      try {
        promise.reject && promise.reject(error)
      } catch (e) {
        // wat?
      }
    })
    this.releaseUpdate(event)
  }

  releaseUpdate(event) {
    if (this.currentUpdate === event) {
      this.currentUpdate = null
      // try to schedule the next one
      this.scheduleUpdate()
    }
  }
}

export default function backgroundPromise(load, options) {
  return new BackgroundPromise(load, options)
}
