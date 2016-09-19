import { assert, expect } from 'chai'
import BackgroundPromise from '../src/background-promise'

describe('background-promise', function() {
  let promiseRandom
  let promiseReject
  let promiseThrow

  before(() => {
    let count = 0
    promiseRandom = new BackgroundPromise((resolve, reject) => {
      setTimeout(() => {
        resolve(count++)
      }, 10)
    }, {
      ttl: 0
    })
    promiseReject = new BackgroundPromise((resolve, reject) => {
      setTimeout(() => {
        reject(`reject`)
      }, 10)
    })
    promiseThrow = new BackgroundPromise((resolve, reject) => {
      throw new Error(`fail`)
    })
  })

  it('executor is required', () => {
    expect(() => new BackgroundPromise()).to.throw(`executor can't be null`)
  })

  it('default value should result in null', () => {
    return promiseRandom.value().then(value => {
      expect(value).to.be.null
    })
  })

  it('get() should be 0', () => {
    return promiseRandom.get().then(value => {
      expect(value).to.be.equal(0)
    })
  })

  it('get({ wait: * }) get 0 and wait for 1', () => {
    return promiseRandom.get({ wait: false }).then(value => {
      expect(value).to.be.equal(0)
    }).then(() => {
      return promiseRandom.get({ wait: true }).then(value => {
        expect(value).to.be.equal(1)
      })
    })
  })

  it('many calls to get() should return 2', () => {
    return Promise.all([
      promiseRandom.get(),
      promiseRandom.get(),
      promiseRandom.get()
    ]).then(values => {
      expect(values).to.be.eql(Array(3).fill(2))
    })
  })

  it('should call reject when executor fail', () => {
    return promiseThrow.get().then(value => {
      assert.fail(`should not call this`)
    }, error => {
      expect(error).to.be.an.instanceof(Error)
    })
  })

  it('should call reject when executor reject', () => {
    return promiseReject.get().then(value => {
      assert.fail(`should not call this`)
    }, error => {
      expect(error).to.be.equal(`reject`)
    })
  })
})
