// 직접 작곡한 곡들. 경쾌한 전자음 팝 느낌(마림바 + 신스 + 드럼)으로 만들었다. (원작 곡을 베끼지 않은 오리지널)
import type { DrumInstName, NoteInstName } from './instruments'

export const STEPS = 16 // 한 마디 = 16분음표 16칸

export interface NoteEv { step: number; midi: number; dur: number; vel: number }
export interface DrumEv { step: number; vel: number }
export interface NoteTrack { kind: 'note'; inst: NoteInstName; vol: number; events: NoteEv[] }
export interface DrumTrack { kind: 'drum'; inst: DrumInstName; vol: number; events: DrumEv[] }
export type Track = NoteTrack | DrumTrack

export interface Song {
  name: string
  bpm: number
  bars: number
  /** 홀수 16분음표를 늦추는 정도(0~0.3). 스윙 느낌 */
  swing: number
  loop: boolean
  tracks: Track[]
}

// ---------- 표기법 해석 ----------
const PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
export function midiOf(name: string): number {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name)
  if (!m) throw new Error(`bad note: ${name}`)
  return 12 * (Number(m[3]) + 1) + PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)
}

/** "E5/2 G5/2 r/4 ..." (음이름/길이(16분음표 칸)) 를 마디마다 해석한다. 길이 합이 16이 아니면 오류 */
export function melody(bars: string[], inst: NoteInstName, vol: number, vel = 1, startBar = 0): NoteTrack {
  const events: NoteEv[] = []
  bars.forEach((bar, bi) => {
    let step = 0
    for (const tok of bar.trim().split(/\s+/)) {
      const [n, d] = tok.split('/')
      const dur = Number(d)
      if (n !== 'r') events.push({ step: (startBar + bi) * STEPS + step, midi: midiOf(n), dur, vel })
      step += dur
    }
    if (step !== STEPS) throw new Error(`bar ${bi + 1} has ${step} steps: ${bar}`)
  })
  return { kind: 'note', inst, vol, events }
}

/** 코드 이름 → 구성음 (기준 base 이상 첫 근음부터) */
export function chordNotes(chord: string, base = 57): number[] {
  const m = /^([A-G][#b]?)(m7|m|7|maj7)?$/.exec(chord)
  if (!m) throw new Error(`bad chord: ${chord}`)
  const root = PC[m[1][0]] + (m[1][1] === '#' ? 1 : m[1][1] === 'b' ? -1 : 0)
  let r = base - (((base % 12) - root + 12) % 12)
  if (r < base) r += 12
  const q = m[2] ?? ''
  const iv = q === 'm' ? [0, 3, 7] : q === '7' ? [0, 4, 7, 10] : q === 'm7' ? [0, 3, 7, 10] : q === 'maj7' ? [0, 4, 7, 11] : [0, 4, 7]
  return iv.map(i => r + i)
}
const rootMidi = (chord: string, octaveBase: number) => chordNotes(chord, octaveBase)[0]

export type BassStyle = 'root5' | 'eighths' | 'gallop' | 'offbeat' | 'walk' | 'half'
/** 코드 진행(마디당 1코드)에서 베이스 라인을 만든다 */
export function bassLine(chords: string[], style: BassStyle, inst: NoteInstName, vol: number, startBar = 0, oct = 36): NoteTrack {
  const events: NoteEv[] = []
  chords.forEach((c, bi) => {
    const r = rootMidi(c, oct)
    const notes = chordNotes(c, oct)
    const fifth = notes[2] ?? r + 7
    const at = (step: number, midi: number, dur: number, vel = 1) => events.push({ step: (startBar + bi) * STEPS + step, midi, dur, vel })
    if (style === 'root5') { at(0, r, 5); at(6, fifth, 2, 0.85); at(8, r, 5); at(14, fifth - 12 + 12, 2, 0.8) }
    else if (style === 'half') { at(0, r, 8); at(8, fifth, 6, 0.85) }
    else if (style === 'eighths') for (let s = 0; s < 16; s += 2) at(s, s % 8 === 6 ? r + 12 : r, 2, s % 4 === 0 ? 1 : 0.8)
    else if (style === 'offbeat') { at(0, r, 2); at(2, r + 12, 2, 0.85); at(4, r, 2, 0.7); at(6, r + 12, 2, 0.85); at(8, r, 2); at(10, r + 12, 2, 0.85); at(12, r, 2, 0.7); at(14, fifth, 2, 0.85) }
    else if (style === 'gallop') for (const s of [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]) at(s, s % 4 === 3 || s === 7 ? r + 12 : r, 1, s % 4 === 0 ? 1 : 0.8)
    else { at(0, r, 3); at(4, notes[1] ?? r + 4, 3, 0.85); at(8, fifth, 3, 0.9); at(12, notes[1] ?? r + 4, 3, 0.8) }
  })
  return { kind: 'note', inst, vol, events }
}

/** 마디 전체를 채우는 화음(패드/스탭) */
export function chordHold(chords: string[], inst: NoteInstName, vol: number, startBar = 0, base = 57, dur = 16): NoteTrack {
  const events: NoteEv[] = []
  chords.forEach((c, bi) => { for (const m of chordNotes(c, base)) events.push({ step: (startBar + bi) * STEPS, midi: m, dur, vel: 1 }) })
  return { kind: 'note', inst, vol, events }
}

/** 지정한 칸에서 화음을 짧게 친다 (브라스 스탭 등) */
export function stabs(chords: string[], steps: number[], inst: NoteInstName, vol: number, dur = 2, startBar = 0, base = 57): NoteTrack {
  const events: NoteEv[] = []
  chords.forEach((c, bi) => { for (const s of steps) for (const m of chordNotes(c, base)) events.push({ step: (startBar + bi) * STEPS + s, midi: m, dur, vel: 1 }) })
  return { kind: 'note', inst, vol, events }
}

/** 코드톤을 16/8분음표로 오르내리는 아르페지오 */
export function arpeggio(chords: string[], every: 1 | 2 | 4, inst: NoteInstName, vol: number, startBar = 0, base = 60, pattern: number[] = [0, 1, 2, 1]): NoteTrack {
  const events: NoteEv[] = []
  chords.forEach((c, bi) => {
    const n = chordNotes(c, base)
    const tones = [...n, n[0] + 12, n[1] + 12]
    for (let s = 0, k = 0; s < STEPS; s += every, k++) {
      const idx = pattern[k % pattern.length]
      events.push({ step: (startBar + bi) * STEPS + s, midi: tones[idx % tones.length], dur: every, vel: s % 4 === 0 ? 1 : 0.7 })
    }
  })
  return { kind: 'note', inst, vol, events }
}

/** 드럼: 마디당 16글자 패턴 문자열(x=세게, o=약하게, .=쉼). 패턴이 마디보다 적으면 반복 */
export function drum(inst: DrumInstName, patterns: string[], bars: number, vol: number, startBar = 0): DrumTrack {
  const events: DrumEv[] = []
  for (let b = 0; b < bars; b++) {
    const p = patterns[b % patterns.length]
    for (let s = 0; s < STEPS; s++) { const ch = p[s]; if (ch === 'x') events.push({ step: (startBar + b) * STEPS + s, vel: 1 }); else if (ch === 'o') events.push({ step: (startBar + b) * STEPS + s, vel: 0.55 }) }
  }
  return { kind: 'drum', inst, vol, events }
}
const REST = '................'
const FOUR = 'x...x...x...x...'
const OFFHAT = '..x...x...x...x.'
const BACK = '....x.......x...'

// =====================================================================================
// 곡 목록
// =====================================================================================

// ---- 타이틀: 밝은 팡파르 느낌의 C장조 (124 BPM) ----
const TITLE_CH = ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'G', 'C', 'Em', 'Am', 'F', 'Dm', 'G', 'C', 'G']
const TITLE_MEL = [
  'E5/4 G5/4 C6/4 G5/4', 'D5/4 G5/4 B5/4 G5/4', 'C5/4 E5/4 A5/4 E5/4', 'A4/4 C5/4 F5/4 A5/4',
  'G5/2 E5/2 C5/2 E5/2 G5/4 C6/4', 'B5/2 G5/2 D5/2 G5/2 B5/4 D6/4', 'C6/4 A5/4 F5/4 A5/4', 'B5/6 A5/2 G5/8',
  'C6/4 B5/2 C6/2 E6/8', 'B5/4 G5/4 E5/4 G5/4', 'A5/2 C6/2 E6/4 D6/2 C6/2 A5/4', 'F5/2 A5/2 C6/4 A5/2 F5/2 C5/4',
  'D6/4 A5/4 F5/4 A5/4', 'G5/4 B5/4 D6/4 G6/4', 'E6/4 C6/4 G5/4 E5/4', 'D5/4 G5/4 B5/4 D6/4',
]
const title: Song = {
  name: 'title', bpm: 124, bars: 16, swing: 0, loop: true,
  tracks: [
    melody(TITLE_MEL, 'marimba', 0.95),
    melody(TITLE_MEL, 'flute', 0.5),
    bassLine(TITLE_CH, 'eighths', 'subBass', 0.8),
    chordHold(TITLE_CH, 'pad', 0.9),
    arpeggio(TITLE_CH.slice(8), 1, 'bell', 0.35, 8, 72, [0, 1, 2, 3, 2, 1]),
    stabs(TITLE_CH.slice(0, 8), [0], 'brass', 0.5, 4, 0, 60),
    drum('kick', [FOUR], 16, 0.9),
    drum('snare', [REST, REST, REST, BACK], 16, 0.75),
    drum('clap', [REST, BACK], 16, 0.35),
    drum('hat', [OFFHAT], 16, 0.6),
    drum('shaker', ['xoxoxoxoxoxoxoxo'], 16, 0.6),
  ],
}

// ---- 베이스캠프: 느긋하고 통통 튀는 G장조 (100 BPM) ----
const CAMP_CH = ['G', 'Em', 'C', 'D', 'G', 'Bm', 'C', 'D', 'Em', 'Bm', 'C', 'G', 'Am', 'D', 'G', 'D']
const CAMP_MEL = [
  'B4/2 D5/2 G5/4 F#5/2 D5/2 B4/4', 'G4/2 B4/2 E5/4 D5/2 B4/2 G4/4', 'E5/2 G5/2 C6/4 B5/2 G5/2 E5/4', 'F#5/4 A5/4 D6/4 C#6/2 A5/2',
  'B4/2 D5/2 G5/4 A5/2 B5/2 D6/4', 'D5/2 F#5/2 B5/4 A5/2 F#5/2 D5/4', 'E5/4 G5/2 E5/2 C6/4 G5/4', 'A5/4 F#5/4 D5/4 r/4',
  'E5/4 G5/4 B5/8', 'D6/4 B5/4 F#5/8', 'E5/4 G5/4 C6/4 E6/4', 'D6/6 B5/2 G5/8',
  'C5/2 E5/2 A5/4 G5/2 E5/2 C5/4', 'D5/2 F#5/2 A5/4 C6/2 A5/2 F#5/4', 'B5/4 G5/4 D5/4 B4/4', 'A4/4 C5/4 D5/4 F#5/4',
]
const camp: Song = {
  name: 'camp', bpm: 100, bars: 16, swing: 0.1, loop: true,
  tracks: [
    melody(CAMP_MEL, 'marimba', 0.95),
    bassLine(CAMP_CH, 'root5', 'pluck', 0.75),
    chordHold(CAMP_CH, 'pad', 0.75, 0, 55),
    arpeggio(CAMP_CH, 2, 'marimba', 0.22, 0, 67, [0, 2, 1, 2]),
    drum('kick', ['x.......x..x....', 'x.......x.......'], 16, 0.55),
    drum('rim', [BACK], 16, 0.5),
    drum('shaker', ['x.x.x.x.x.x.x.x.'], 16, 0.7),
    drum('hat', ['..o...o...o...o.'], 16, 0.4),
  ],
}

// ---- 섬 지도: 모험이 시작되는 D장조, 플루트 선율 (112 BPM) ----
const MAP_CH = ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'D', 'F#m', 'Bm', 'G', 'Em', 'A', 'D', 'A']
const MAP_MEL = [
  'A4/4 D5/4 F#5/4 A5/4', 'G5/4 E5/4 C#5/4 E5/4', 'D5/4 F#5/4 B5/6 A5/2', 'G5/4 B5/4 D6/4 B5/4',
  'A5/2 F#5/2 D5/4 F#5/2 A5/2 D6/4', 'C#6/4 B5/2 A5/2 E5/8', 'B5/4 A5/4 G5/4 B5/4', 'A5/8 r/2 E5/2 A5/4',
  'F#5/2 A5/2 D6/4 C#6/2 A5/2 F#5/4', 'A5/2 C#6/2 F#6/4 E6/2 C#6/2 A5/4', 'D6/4 B5/4 D6/4 F#6/4', 'E6/4 D6/4 B5/4 G5/4',
  'G5/2 B5/2 E6/4 D6/2 B5/2 G5/4', 'E6/4 C#6/4 A5/4 E5/4', 'D6/8 A5/4 F#5/4', 'E5/4 G5/4 A5/4 C#6/4',
]
const map: Song = {
  name: 'map', bpm: 112, bars: 16, swing: 0, loop: true,
  tracks: [
    melody(MAP_MEL, 'flute', 1),
    melody(MAP_MEL, 'marimba', 0.35),
    bassLine(MAP_CH, 'walk', 'pluck', 0.7),
    chordHold(MAP_CH, 'pad', 0.8, 0, 57),
    arpeggio(MAP_CH, 2, 'bell', 0.3, 0, 69, [0, 1, 2, 1]),
    drum('kick', ['x.......x...x...', FOUR], 16, 0.7),
    drum('snare', [BACK], 16, 0.55),
    drum('hat', [OFFHAT], 16, 0.55),
    drum('shaker', ['xoxoxoxoxoxoxoxo'], 16, 0.5),
  ],
}

// ---- 전투: 달리는 느낌의 E단조 (148 BPM) ----
const BAT_CH = ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'B', 'Am', 'Em', 'C', 'D', 'Am', 'Em', 'B', 'B']
const BAT_MEL = [
  'E5/2 G5/2 B5/2 G5/2 E5/4 r/2 G5/2', 'E5/2 G5/2 C6/2 G5/2 E5/4 r/2 D5/2', 'D5/2 G5/2 B5/2 G5/2 D6/4 B5/2 G5/2', 'F#5/2 A5/2 D6/2 A5/2 F#5/4 r/2 A5/2',
  'B5/4 G5/2 E5/2 B5/4 G5/2 E5/2', 'C6/4 G5/2 E5/2 C6/4 E6/2 D6/2', 'D6/4 A5/2 F#5/2 D6/4 F#6/2 E6/2', 'D#6/4 F#6/4 B5/4 A5/2 F#5/2',
  'A5/2 C6/2 E6/2 C6/2 A5/4 r/2 C6/2', 'G5/2 B5/2 E6/2 B5/2 G5/4 r/2 B5/2', 'G5/2 C6/2 E6/2 C6/2 G5/4 r/2 E5/2', 'A5/2 D6/2 F#6/2 D6/2 A5/4 r/2 F#5/2',
  'C6/4 E6/4 A6/4 E6/4', 'B5/4 E6/4 G6/4 E6/4', 'F#6/4 D#6/4 B5/4 D#6/4', 'F#6/8 r/2 B5/2 D#6/2 F#6/2',
]
const battle: Song = {
  name: 'battle', bpm: 148, bars: 16, swing: 0, loop: true,
  tracks: [
    melody(BAT_MEL, 'lead', 0.95),
    bassLine(BAT_CH, 'eighths', 'subBass', 0.85),
    bassLine(BAT_CH, 'offbeat', 'pluck', 0.35, 0, 48),
    stabs(BAT_CH, [0, 6, 10], 'brass', 0.45, 2, 0, 60),
    arpeggio(BAT_CH.slice(4, 8), 1, 'marimba', 0.28, 4, 72, [0, 1, 2, 1, 2, 3]),
    arpeggio(BAT_CH.slice(12), 1, 'marimba', 0.28, 12, 72, [0, 1, 2, 1, 2, 3]),
    drum('kick', [FOUR, 'x...x...x...x.x.'], 16, 0.95),
    drum('snare', [BACK], 16, 0.8),
    drum('clap', [BACK], 16, 0.3),
    drum('hat', [OFFHAT, 'xxxxxxxxxxxxxxxx'], 16, 0.6),
    drum('openHat', ['..............x.', REST], 16, 0.5),
    drum('tom', [REST, REST, REST, '............xxxx'], 16, 0.7),
  ],
}

// ---- 보스전: 낮고 빠른 D단조 (168 BPM) ----
const BOSS_CH = ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A', 'Dm', 'F', 'Bb', 'A', 'Gm', 'A', 'Dm', 'A']
const BOSS_MEL = [
  'D5/2 F5/2 A5/2 F5/2 D5/2 F5/2 A5/4', 'D6/4 C6/2 A5/2 F5/4 A5/4', 'Bb5/2 D6/2 F6/2 D6/2 Bb5/4 D6/2 C6/2', 'C#6/2 E6/2 A6/2 E6/2 C#6/4 E6/4',
  'A5/2 D6/2 F6/2 D6/2 A5/4 r/2 A5/2', 'G5/2 A5/2 D6/2 A5/2 G5/4 F5/4', 'G5/2 Bb5/2 D6/2 Bb5/2 G5/4 Bb5/2 D6/2', 'E6/4 C#6/4 A5/4 E5/4',
  'F6/4 A5/4 D6/4 A5/4', 'C6/2 F6/2 A6/2 F6/2 C6/4 A5/4', 'D6/2 F6/2 Bb6/2 F6/2 D6/4 F6/4', 'E6/4 A5/2 C#6/2 E6/4 A6/4',
  'D6/2 G6/2 Bb6/2 G6/2 D6/4 Bb5/4', 'C#6/2 E6/2 G6/2 E6/2 C#6/4 A5/4', 'D6/4 F6/4 A6/4 F6/4', 'E6/8 C#6/4 A5/4',
]
const boss: Song = {
  name: 'boss', bpm: 168, bars: 16, swing: 0, loop: true,
  tracks: [
    melody(BOSS_MEL, 'lead', 1),
    bassLine(BOSS_CH, 'gallop', 'subBass', 0.9),
    chordHold(BOSS_CH, 'pad', 0.7, 0, 52),
    stabs(BOSS_CH, [0, 3, 6, 8, 11], 'brass', 0.55, 2, 0, 57),
    arpeggio(BOSS_CH, 1, 'pluck', 0.22, 0, 74, [0, 2, 1, 2]),
    drum('kick', [FOUR, 'x..xx..xx...x...'], 16, 1),
    drum('snare', [BACK, '....x.......x.x.'], 16, 0.85),
    drum('hat', ['xxxxxxxxxxxxxxxx'], 16, 0.55),
    drum('openHat', [OFFHAT], 16, 0.35),
    drum('tom', [REST, REST, REST, '..........xxxxxx'], 16, 0.8),
  ],
}

// ---- 인트로(이야기): 잔잔한 A단조 (76 BPM) ----
const STORY_CH = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E']
const STORY_MEL = ['E5/8 A5/8', 'C6/8 A5/8', 'G5/8 E5/8', 'D5/6 G5/2 B5/8', 'E5/8 A5/8', 'A5/6 C6/2 F5/8', 'B5/8 D6/8', 'G#5/8 E5/8']
const story: Song = {
  name: 'story', bpm: 76, bars: 8, swing: 0, loop: true,
  tracks: [
    melody(STORY_MEL, 'flute', 0.9),
    chordHold(STORY_CH, 'pad', 1, 0, 55),
    arpeggio(STORY_CH, 2, 'marimba', 0.3, 0, 64, [0, 1, 2, 1]),
    bassLine(STORY_CH, 'half', 'subBass', 0.55),
    drum('shaker', ['x...x...x...x...'], 8, 0.3),
  ],
}

// =====================================================================================
// 짧은 효과 음악(한 번만 연주)
// =====================================================================================
const win: Song = {
  name: 'win', bpm: 140, bars: 2, swing: 0, loop: false,
  tracks: [
    melody(['C5/2 E5/2 G5/2 C6/2 r/2 G5/2 C6/2 E6/2', 'G6/8 E6/2 G6/2 C7/4'], 'marimba', 1),
    melody(['C5/2 E5/2 G5/2 C6/2 r/2 G5/2 C6/2 E6/2', 'G5/8 E5/2 G5/2 C6/4'], 'brass', 0.6),
    chordHold(['C', 'C'], 'pad', 1, 0, 55),
    bassLine(['C', 'C'], 'root5', 'subBass', 0.8),
    drum('kick', ['x...x...x...x...', 'x...............'], 2, 0.8),
    drum('snare', [BACK, REST], 2, 0.6),
    drum('clap', [REST, 'x...............'], 2, 0.5),
  ],
}
const lose: Song = {
  name: 'lose', bpm: 84, bars: 2, swing: 0, loop: false,
  tracks: [
    melody(['E5/4 D5/4 C5/4 A4/4', 'G4/12 r/4'], 'flute', 1),
    chordHold(['Am', 'Am'], 'pad', 1, 0, 52),
    bassLine(['Am', 'Am'], 'half', 'subBass', 0.6),
  ],
}
const levelup: Song = {
  name: 'levelup', bpm: 150, bars: 1, swing: 0, loop: false,
  tracks: [
    melody(['C5/1 E5/1 G5/1 C6/1 E6/1 G6/1 C7/4 r/6'], 'marimba', 1),
    melody(['C6/1 E6/1 G6/1 C7/1 E7/1 G7/1 C7/4 r/6'], 'bell', 0.45),
  ],
}
const cookSong: Song = {
  name: 'cook', bpm: 150, bars: 1, swing: 0, loop: false,
  tracks: [
    melody(['G5/1 B5/1 D6/1 G6/1 B6/1 D7/8 r/3'], 'marimba', 1),
    melody(['G6/1 B6/1 D7/1 G7/1 B6/1 D7/8 r/3'], 'bell', 0.4),
    drum('shaker', ['xoxoxoxo........'], 1, 0.8),
  ],
}


// =====================================================================================
// 지역별 오리지널 전투 테마: 6곡 (원작의 멜로디/음원을 복제하지 않음)
// 각 지역 고유의 조성과 모티프, 리듬, 악기 배치를 사용한다.
// =====================================================================================
function regional(
  name: string, bpm: number, chords: string[], bars: string[], inst: NoteInstName,
  bass: BassStyle, kick: string[], snare: string[], hats: string[], swing = 0,
): Song {
  return {
    name, bpm, bars: 8, swing, loop: true,
    tracks: [
      melody(bars, inst, 0.98),
      bassLine(chords, bass, 'pluck', 0.76, 0, 39),
      chordHold(chords, 'pad', 0.64, 0, 55),
      arpeggio(chords, 2, inst === 'bell' ? 'marimba' : 'bell', 0.30, 0, 69, [0, 2, 1, 3, 2, 1]),
      stabs(chords, [0, 10], 'brass', 0.24, 2, 0, 60),
      drum('kick', kick, 8, 0.70),
      drum('rim', snare, 8, 0.55),
      drum('shaker', hats, 8, 0.40),
    ],
  }
}

const tide = regional('tide', 116,
  ['D', 'A', 'Bm', 'G', 'D', 'G', 'A', 'D'], [
    'F#5/2 A5/2 D6/4 A5/4 F#5/4', 'E5/2 C#5/2 E5/4 A5/4 C#6/4',
    'F#5/4 B5/4 D6/4 F#6/4', 'D5/4 G5/4 B5/4 D6/4',
    'A5/2 F#5/2 E5/2 F#5/2 A5/4 D6/4', 'B5/4 D6/4 G6/4 D6/4',
    'E5/4 A5/4 C#6/4 E6/4', 'D6/8 A5/4 F#5/4',
  ], 'marimba', 'offbeat',
  ['x.......x...x...', 'x..x....x.......'], [BACK], ['xox.xox.xox.xoxo'], 0.12)

const grove = regional('grove', 108,
  ['G', 'Em', 'C', 'D', 'G', 'C', 'Am', 'D'], [
    'D5/4 G5/4 B5/4 D6/4', 'G5/2 B5/2 E6/4 B5/4 G5/4',
    'E5/4 G5/4 C6/4 G5/4', 'F#5/4 A5/4 D6/4 A5/4',
    'B5/2 A5/2 G5/4 D5/4 G5/4', 'G5/4 E5/4 C5/4 E5/4',
    'A5/4 C6/4 E6/4 C6/4', 'A5/4 F#5/4 D5/8',
  ], 'flute', 'walk',
  ['x.......x.......', 'x...x.......x...'], ['....o.......x...'], ['x.x.o.x.x.x.o.x.'], 0.09)

const echo = regional('echo', 94,
  ['Am', 'F', 'Dm', 'E', 'Am', 'C', 'F', 'E'], [
    'A4/4 C5/4 E5/8', 'A4/2 C5/2 F5/4 E5/4 C5/4',
    'D5/4 F5/4 A5/8', 'B4/8 G#5/4 E5/4',
    'A4/2 C5/2 E5/4 C5/4 A4/4', 'G4/4 C5/4 E5/8',
    'F5/4 A5/4 C6/8', 'G#5/4 B5/4 E6/4 r/4',
  ], 'bell', 'half',
  ['x...............', 'x.......o.......'], ['........o.......'], ['..o...o...o...o.'])

const spark = regional('spark', 142,
  ['Em', 'C', 'G', 'D', 'Em', 'Am', 'B', 'Em'], [
    'E5/2 G5/2 B5/2 E6/2 G5/4 B5/4', 'C5/2 E5/2 G5/4 E5/2 G5/2 C6/4',
    'D5/4 G5/2 B5/2 D6/4 G5/4', 'F#5/2 A5/2 D6/4 A5/4 F#5/4',
    'G5/2 B5/2 E6/4 D6/2 B5/2 G5/4', 'A5/4 C6/4 E6/4 C6/4',
    'B4/2 D#5/2 F#5/4 B5/4 F#5/4', 'E6/8 B5/4 G5/4',
  ], 'lead', 'gallop',
  ['x...x...x...x...', 'x..xx...x..xx...'], [BACK], ['xxxxxxxxxxxxxxxx'])

const ember = regional('ember', 150,
  ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'A', 'Dm'], [
    'D5/4 F5/4 A5/4 D6/4', 'Bb4/2 D5/2 F5/4 Bb5/4 F5/4',
    'G4/4 Bb4/4 D5/4 G5/4', 'A4/4 C#5/4 E5/4 A5/4',
    'D5/2 F5/2 A5/2 D6/2 A5/4 F5/4', 'F5/4 Bb5/4 D6/4 Bb5/4',
    'E5/2 A5/2 C#6/4 E6/4 C#6/4', 'D6/8 A5/4 F5/4',
  ], 'brass', 'gallop',
  ['x...x...x...x...', 'x..x..x.x...x...'], [BACK, '....x.....x.x...'], ['x.x.x.x.x.x.x.x.'])

const astral = regional('astral', 114,
  ['C', 'Am', 'F', 'G', 'C', 'Em', 'Dm', 'G'], [
    'G5/4 C6/4 E6/4 G6/4', 'E5/2 A5/2 C6/4 E6/4 C6/4',
    'F5/4 A5/4 C6/4 F6/4', 'D5/4 G5/4 B5/8',
    'E6/4 C6/4 G5/4 E5/4', 'G5/2 B5/2 E6/4 G6/4 E6/4',
    'A5/4 D6/4 F6/4 D6/4', 'G5/8 D5/4 B4/4',
  ], 'bell', 'root5',
  ['x.......x.......', 'x...........o...'], ['........o.......'], ['..o...o...o...o.'])

// 6개 지역 테마는 맵/스토리 음악과 별개로 탐험 전투 중에 재생된다.

export const SONGS = { title, camp, map, battle, boss, story, tide, grove, echo, spark, ember, astral } as const
export const JINGLES = { win, lose, levelup, cook: cookSong } as const
export type SongName = keyof typeof SONGS
export type JingleName = keyof typeof JINGLES
export const ALL_TRACKS: Song[] = [...Object.values(SONGS), ...Object.values(JINGLES)]
