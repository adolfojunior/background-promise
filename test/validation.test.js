import { assert, expect } from 'chai'
import backgroundPromise from '../src/background-promise'

const timeoutPromise = (time) => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

describe('options validation', function() {

  it(`options can't be null`, () => {
    expect(() => backgroundPromise()).to.throw(`options can't be null`)
  })

  it(`load function can't be null`, () => {
    expect(() => backgroundPromise({})).to.throw(`load function can't be null`)
  })

  it('should call reject when executor throws error', () => {
    return backgroundPromise({
      load (resolve, reject) {
        throw new Error(`fail`)
      }
    }).get().then(value => {
      assert.fail(`should not call this`)
    }, error => {
      expect(error).to.be.an.instanceof(Error)
    })
  })

  it('should call reject when executor reject', () => {
    return backgroundPromise({
      load (resolve, reject) {
        reject(`reject`)
      }
    }).get().then(value => {
      assert.fail(`should not call this`)
    }, error => {
      expect(error).to.be.equal(`reject`)
    })
  })
})
