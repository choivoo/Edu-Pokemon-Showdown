import { describe, expect, it } from 'vitest'
import { OFFICIAL_CUES } from './officialCues'
import { LICENSED_ASSET_URL, SOUNDTRACK_DURATION, soundtrackRange, soundtrackSecond } from './licensedSoundtrack'

describe('Fan Edition 1.0 licensed soundtrack stream',()=>{
 it('routes every one of 27 scenes to the complete provided MP3 without overlap/gaps',()=>{
  expect(OFFICIAL_CUES.length).toBe(27)
  const scenes=OFFICIAL_CUES.map(([id])=>soundtrackRange(id))
  expect(scenes[0]).toEqual({start:0,end:158})
  for(let i=0;i<scenes.length;i++){
   expect(scenes[i].end-scenes[i].start).toBeGreaterThan(20)
   if(i>0)expect(scenes[i].start).toBe(scenes[i-1].end)
  }
  expect(scenes[26].start).toBe(4247)
  expect(scenes[26].end).toBe(4524)
  expect(scenes[26].end).toBeLessThanOrEqual(SOUNDTRACK_DURATION)
 })
 it('uses a public asset on the existing 1.0 official release for all devices',()=>{
  expect(LICENSED_ASSET_URL).toMatch(/^https:\/\/github\.com\/choivoo\/Pokemon-Quest-fan\.Edition\/releases\/download\/v1\.0\.0-official\/quest-licensed-soundtrack\.mp3$/)
 })
 it('accepts MM:SS and H:MM:SS chapter timestamps',()=>{
  expect(soundtrackSecond('00:00')).toBe(0)
  expect(soundtrackSecond('11:24')).toBe(684)
  expect(soundtrackSecond('1:02:23')).toBe(3743)
  expect(()=>soundtrackSecond('abc')).toThrow()
 })
})
