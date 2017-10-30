import expect from 'expect'
import { h, Component } from 'preact'
import { deep } from 'preact-render-spy'

import makeOrganism from 'src/'

const waitMs = duration => new Promise(resolve => setTimeout(resolve, duration))

const nextFrame = () => new Promise((resolve) => {
  window.requestAnimationFrame(resolve)
})


function Counter({
  count,
  handlers: {
    increment,
    decrement,
    delayedIncrement,
    delayedIncrementGenerator,
    doNothing,
    blowUp,
    blowUp2,
    blowUpDelayed,
    initial,
    load
  }
}) {
  return (
    <div>
      <button id='decrement' onClick={ decrement } children='−' />
      <span id='currentCount'>{ count }</span>
      <button id='increment' onClick={ increment } children='+' />
      { delayedIncrement &&
        <button id='delayedIncrement' onClick={ delayedIncrement } children='+' />
      }
      { delayedIncrementGenerator &&
        <button id='delayedIncrementGenerator' onClick={ delayedIncrementGenerator } children='+' />
      }
      { doNothing &&
        <button id='doNothing' onClick={ doNothing } children='Do Nothing' />
      }
      { blowUp &&
        <button id='blowUp' onClick={ blowUp } children='Blow Up' />
      }
      { blowUp2 &&
        <button id='blowUp2' onClick={ blowUp2 } children='Blow Up 2' />
      }
      { blowUpDelayed &&
        <button id='blowUpDelayed' onClick={ blowUpDelayed } children='Blow Up Delayed' />
      }
      <button id='initial' onClick={ initial } children='Reset' />
      { load &&
        <button id='reload' onClick={ load } children='Reload' />
      }
    </div>
  )
}

describe('makeOrganism', () => {
  let node;
  let context;
  let latestState;
  const getCountText = () => context.find('#currentCount').text()
  const click = (selector) => context.find(selector).simulate('click')

  it('Sends click events', async () => {
    let changeCount = 0
    const delayWait = 20

    const CounterOrganism = makeOrganism(Counter, {
      initial: ({ initialCount = 0 }) => ({ count: initialCount }),
      increment: () => ({ count }) => ({ count: count + 1 }),
      decrement: () => ({ count }) => ({ count: count - 1 }),
      delayedIncrement: async () => {
        await waitMs(delayWait / 2)
        await waitMs(delayWait / 2)
        return ({ count }) => ({ count: count + 1 })
      },
      delayedIncrementGenerator: function *() {
        yield waitMs(delayWait / 2)
        yield waitMs(delayWait / 2)
        yield ({ count }) => ({ count: count + 1 })
      },
      doNothing: () => {},
      blowUp: () => {
        throw new Error('Whoops')
      },
      blowUp2: () => (prevState) => {
        throw new Error('Whoops 2')
      },
      blowUpDelayed: async () => {
        await waitMs(delayWait)
        throw new Error('Whoops Delayed')
      }
    }, {
      onChange(state) {
        latestState = state
        changeCount++
      }
    })

    context = deep(<CounterOrganism initialCount={ 2 } />)

    expect(getCountText()).toBe('2')

    // Click increment
    click('#increment')
    expect(getCountText()).toBe('3')

    // Click decrement
    click('#decrement')
    expect(getCountText()).toBe('2')
    expect(changeCount).toBe(2)

    // Click delayedIncrement
    click('#delayedIncrement')
    await waitMs(delayWait + 5)
    expect(getCountText()).toBe('3')
    expect(changeCount).toBe(3)

    // Click delayedIncrementGenerator
    click('#delayedIncrementGenerator')
    await waitMs(delayWait / 2)
    await nextFrame()
    await waitMs(delayWait / 2)
    await nextFrame()
    await waitMs(5)
    expect(getCountText()).toBe('4')
    expect(changeCount).toBe(4)

    click('#doNothing')
    expect(getCountText()).toBe('4')
    expect(changeCount).toBe(4)

    // Click blowUp
    click('#blowUp')
    expect(latestState.handlerError).toExist()
    expect(latestState.handlerError.message).toBe('Whoops')

    // Click blowUp2
    click('#blowUp2')
    expect(latestState.handlerError).toExist()
    expect(latestState.handlerError.message).toBe('Whoops 2')

    // Click blowUpDelayed
    click('#blowUpDelayed')
    await waitMs(delayWait + 5)
    expect(latestState.handlerError).toExist()
    expect(latestState.handlerError.message).toBe('Whoops Delayed')

    expect(changeCount).toBe(7)
  })

  it('Calls load handler', async () => {
    let changeCount = 0
    let latestState;
    const loadWait = 35

    const CounterOrganism = makeOrganism(Counter, {
      initial: ({ initialCount = 0 }) => ({ count: initialCount }),
      load: async ({ loadedCount }, prevProps) => {
        if (!prevProps || loadedCount !== prevProps.loadedCount) {
          await waitMs(loadWait)
          const count = loadedCount * 2 // Multiply to be sure we are using this loaded value
          if (Number.isNaN(count)) {
            throw new Error('Loaded count is invalid')
          }
          return { count }
        }
      },
      increment: () => ({ count }) => ({ count: count + 1 }),
      decrement: () => ({ count }) => ({ count: count - 1 })
    }, {
      onChange(state) {
        latestState = state
        changeCount++
      }
    })

    context = deep(<CounterOrganism initialCount={ 2 } loadedCount={ 7 } />)
    expect(getCountText()).toBe('2')

    // Click increment
    click('#increment')
    expect(getCountText()).toBe('3')

    // Click decrement
    click('#decrement')
    expect(getCountText()).toBe('2')

    expect(changeCount).toBe(2)

    await waitMs(loadWait + 5)
    expect(getCountText()).toBe('14')
    expect(changeCount).toBe(3)

    context.render(<CounterOrganism initialCount={ 22 } loadedCount={ 7 } />)
    await waitMs(loadWait + 5)
    expect(getCountText()).toBe('14')
    expect(changeCount).toBe(3)

    context.render(<CounterOrganism initialCount={ 22 } loadedCount={ 9 } />)
    await waitMs(loadWait + 5)
    expect(getCountText()).toBe('18')
    expect(changeCount).toBe(4)

    // Click reload
    click('#reload')
    await waitMs(loadWait + 5)
    expect(getCountText()).toBe('18')
    expect(changeCount).toBe(5)

    // Load error
    context.render(<CounterOrganism initialCount={ 22 } loadedCount='Not a number' />)
    await waitMs(loadWait + 5)
    expect(latestState.loadError).toExist()
    expect(changeCount).toBe(6)
  })

})
