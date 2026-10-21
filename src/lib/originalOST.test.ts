import { describe, expect, it } from 'vitest'
import { ALL_TRACKS, REGION_SONG_NAMES, SONGS, STEPS } from './songs'
describe('오리지널 OST 음악 데이터',()=>{
 it('지역별 6곡과 기본 트랙을 모두 갖춘다',()=>{
   expect(REGION_SONG_NAMES).toHaveLength(6)
   for(const id of REGION_SONG_NAMES){
     const s=SONGS[id]
     expect(s.bars).toBe(16)
     expect(s.tracks.length).toBeGreaterThanOrEqual(8)
   }
 })
 it('모든 이벤트의 박자 위치와 연주 길이가 정상 범위이다',()=>{
   for(const song of ALL_TRACKS) {
     expect(song.bpm).toBeGreaterThan(50)
     for(const tr of song.tracks){
       expect(tr.vol).toBeGreaterThan(0)
       for(const e of tr.events){
         expect(e.step).toBeGreaterThanOrEqual(0)
         expect(e.step).toBeLessThan(song.bars*STEPS)
         expect(e.vel).toBeGreaterThan(0)
         if(tr.kind==='note'){
           const note=e as {midi:number;dur:number}
           expect(note.midi).toBeGreaterThan(20)
           expect(note.midi).toBeLessThan(115)
           expect(note.dur).toBeGreaterThan(0)
         }
       }
     }
   }
 })
})
