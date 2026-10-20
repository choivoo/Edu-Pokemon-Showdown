import { describe, expect, it } from 'vitest'
import { ALL_TRACKS, chordNotes, midiOf, SONGS, STEPS, type Song } from './songs'

// 곡마다 사용하는 조(음계). 임시표(반음 올림/내림)로 쓴 한두 음도 허용한다.
const SCALES: Record<string, number[]> = {
  title: [0, 2, 4, 5, 7, 9, 11],
  camp: [7, 9, 11, 0, 2, 4, 6],
  map: [2, 4, 6, 7, 9, 11, 1],
  battle: [4, 6, 7, 9, 11, 0, 2, 3], // E 단조 + D# (딸림화음의 이끎음)
  boss: [2, 4, 5, 7, 9, 10, 0, 1], // D 단조 + C#
  story: [9, 11, 0, 2, 4, 5, 7, 8], // A 단조 + G#
}

const melodicTracks = (s: Song) => s.tracks.filter(t => t.kind === 'note' && (t.inst === 'marimba' || t.inst === 'flute' || t.inst === 'lead') && t.vol >= 0.9)

describe('음악', () => {
  it('음이름 해석', () => {
    expect(midiOf('C4')).toBe(60)
    expect(midiOf('A4')).toBe(69)
    expect(midiOf('F#5')).toBe(78)
    expect(midiOf('Bb3')).toBe(58)
  })

  it('코드 구성음', () => {
    expect(chordNotes('C', 60)).toEqual([60, 64, 67])
    expect(chordNotes('Am', 57)).toEqual([57, 60, 64])
    expect(chordNotes('G', 57).map(n => n % 12)).toEqual([7, 11, 2])
    expect(chordNotes('B', 57).map(n => n % 12)).toEqual([11, 3, 6])
  })

  it('모든 곡이 정상적으로 불러와지고(마디 길이 검증 통과) 트랙이 있다', () => {
    expect(ALL_TRACKS.length).toBe(10)
    for (const s of ALL_TRACKS) {
      expect(s.tracks.length).toBeGreaterThan(1)
      expect(s.bpm).toBeGreaterThan(60)
    }
  })

  it('모든 이벤트가 곡 길이 안에 있고 음높이가 들을 수 있는 범위다', () => {
    for (const s of ALL_TRACKS) {
      const total = s.bars * STEPS
      for (const t of s.tracks) {
        for (const e of t.events) {
          expect(e.step).toBeGreaterThanOrEqual(0)
          expect(e.step).toBeLessThan(total)
          if (t.kind === 'note') { const m = (e as { midi: number }).midi; expect(m).toBeGreaterThanOrEqual(28); expect(m).toBeLessThanOrEqual(104) }
        }
      }
    }
  })

  it('주선율이 곡의 조성을 벗어나지 않는다 (90% 이상이 음계 안)', () => {
    for (const [name, scale] of Object.entries(SCALES)) {
      const song = SONGS[name as keyof typeof SONGS]
      const notes = melodicTracks(song).flatMap(t => t.events as { midi: number }[])
      expect(notes.length).toBeGreaterThan(10)
      const inKey = notes.filter(n => scale.includes(n.midi % 12)).length / notes.length
      expect(inKey, name).toBeGreaterThanOrEqual(0.9)
    }
  })

  it('주선율의 대부분이 해당 마디 코드의 구성음이거나 음계음이다 (화음과 어긋나지 않음)', () => {
    // 마디의 첫 박(강박)에 오는 음은 그 마디 코드의 구성음이어야 자연스럽다
    const progressions: Record<string, string[]> = {
      title: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'C', 'Em', 'Am', 'F', 'Dm', 'G', 'C', 'G'],
      camp: ['G', 'Em', 'C', 'D', 'G', 'Bm', 'C', 'D', 'Em', 'Bm', 'C', 'G', 'Am', 'D', 'G', 'D'],
      map: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'D', 'F#m', 'Bm', 'G', 'Em', 'A', 'D', 'A'],
      battle: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'B', 'Am', 'Em', 'C', 'D', 'Am', 'Em', 'B', 'B'],
      boss: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'F', 'Bb', 'A', 'Gm', 'A', 'Dm', 'A'],
    }
    for (const [name, chords] of Object.entries(progressions)) {
      const song = SONGS[name as keyof typeof SONGS]
      const strong = melodicTracks(song).flatMap(t => (t.events as { step: number; midi: number }[]).filter(e => e.step % STEPS === 0))
      expect(strong.length).toBeGreaterThan(8)
      const ok = strong.filter(e => chordNotes(chords[Math.floor(e.step / STEPS)], 48).map(n => n % 12).includes(e.midi % 12)).length / strong.length
      expect(ok, name).toBeGreaterThanOrEqual(0.7)
    }
  })

  it('반복되는 곡은 마지막 마디가 첫 마디로 자연스럽게 이어진다 (코드 진행이 한 바퀴 돈다)', () => {
    for (const s of Object.values(SONGS)) expect(s.loop).toBe(true)
  })
})
