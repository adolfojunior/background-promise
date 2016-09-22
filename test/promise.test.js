import { assert, expect } from 'chai'
import backgroundPromise from '../src/background-promise'

const timeoutPromise = (time) => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

describe('promise behavior', function() {
  let count
  let promiseCount

  beforeEach(() => {
    count = 0
    promiseCount = backgroundPromise({
      load (resolve, reject) {
        timeoutPromise(3).then(() => {
          resolve(count++)
        })
      }
    })
  })

  it('first value should wait', () => {
    return promiseCount.getLast().then(value => {
      expect(value).to.be.equal(0)

      return promiseCount.get().then(value => {
        expect(value).to.be.equal(1)

        return promiseCount.getLast().then(value => {
          // should get the last cached value and trigger an update
          expect(value).to.be.equal(1)

          return promiseCount.get().then(value => {
            expect(value).to.be.equal(2)
          })
        })
      })
    })
  })

  it('should resolve all promises', () => {
    expect(promiseCount.rawValue()).to.be.equal(null)
    return Promise.all([
      promiseCount.get(),
      promiseCount.getLast(),
      promiseCount.get()
    ]).then(values => {
      expect(count).to.be.equal(1)
      expect(values).to.be.eql([0, 0, 0])

      return Promise.all([
        promiseCount.get(),
        promiseCount.getLast(),
        promiseCount.get()
      ]).then(values => {
        expect(count).to.be.equal(2)
        expect(values).to.be.eql([1, 0, 1])

        return Promise.all([
          promiseCount.getLast(),
          promiseCount.get(),
          promiseCount.get()
        ]).then(values => {
          expect(count).to.be.equal(3)
          expect(values).to.be.eql([1, 2, 2])
        })
      })
    })
  })

  it('value should expires after ttl', () => {
    const valueCache = backgroundPromise({
      ttl: 200,
      load (resolve, reject) {
        timeoutPromise(1).then(() => {
          resolve(count++)
        })
      }
    })

    return valueCache.get().then(value => {
      expect(value).to.be.equal(0)

      return timeoutPromise(50).then(() => {
        expect(valueCache.isExpired()).to.be.false

        return valueCache.get().then(value => {
          expect(value).to.be.equal(0)

          return timeoutPromise(200).then(() => {
            expect(valueCache.isExpired()).to.be.true

            return valueCache.get().then(value => {
              expect(value).to.be.equal(1)
            })
          })
        })
      })
    })
  })

  it('value should be updated after a interval', () => {
    const valueCache = backgroundPromise({
      interval: 50,
      load (resolve, reject) {
        timeoutPromise(1).then(() => resolve(count++))
      }
    })
    return timeoutPromise(100).then(() => {
      expect(valueCache.rawValue()).to.not.be.null
    })
  })

  it('should retrieve immediate', () => {
    const valueCache = backgroundPromise({
      immediate: true,
      load (resolve, reject) {
        timeoutPromise(1).then(() => resolve(count++))
      }
    })
    return timeoutPromise(10).then(() => {
      expect(valueCache.rawValue()).to.not.be.null
    })
  })
})
