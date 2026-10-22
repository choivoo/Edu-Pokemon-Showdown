import { afterEach, describe, expect, it } from 'vitest'
import { useGame } from '../store/gameStore'
import { defaultSave } from './storage'

afterEach(()=>useGame.getState().hardReset())

describe('Fan Edition 1.0 account reset',()=>{
  it('clears campaign, owned Pokémon, items, party, decorations and returns to title',()=>{
    const game=useGame.getState()
    game.hardReset()
    game.newGame('리셋검사',25)
    expect(useGame.getState().save.started).toBe(true)
    useGame.setState(x=>({save:{...x.save,coins:7777,pmTickets:999,
      decorations:['dittoBalloon'],cleared:{'6-0':true},
      counters:{clears:99}}}))
    useGame.getState().hardReset()
    const state=useGame.getState()
    const defaults=defaultSave()
    expect(state.save.started).toBe(false)
    expect(state.save.name).toBe('')
    expect(state.save.coins).toBe(defaults.coins)
    expect(state.save.pmTickets).toBe(0)
    expect(state.save.decorations).toEqual([])
    expect(state.save.cleared).toEqual({})
    expect(state.save.owned).toEqual([])
    expect(state.save.party).toEqual([])
    expect(state.save.counters).toEqual({})
    expect(state.screen).toBe('title')
    expect(state.panel).toBe(null)
    expect(state.stage).toBe(null)
    expect(state.result).toBe(null)
  })
  it('preserves only player sound preference when resetting local game',()=>{
    useGame.getState().hardReset()
    useGame.setState(s=>({save:{...s.save,muted:true}}))
    useGame.getState().hardReset()
    expect(useGame.getState().save.muted).toBe(true)
  })
})
