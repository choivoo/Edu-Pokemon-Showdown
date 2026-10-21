// 효과음은 Web Audio API로 직접 만든다. 배경음악/효과 음악은 music.ts, 곡 악보는 songs.ts
import { audio, isMuted, masterOut, setMuted } from './audio'
import { bgm, jingle } from './music'

export { bgm, isMuted, setMuted }

function beep(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slideTo?: number) {
  const c = audio()
  const out = masterOut()
  if (!c || !out) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(out)
  osc.start(t0)
  osc.stop(t0 + dur)
}

function noise(start: number, dur: number, vol = 0.1) {
  const c = audio()
  const out = masterOut()
  if (!c || !out) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = vol
  src.buffer = buf
  src.connect(gain).connect(out)
  src.start(c.currentTime + start)
}

/**
 * 각 포켓몬의 도감 번호를 씨앗으로 쓰는 오리지널 전자 울음소리.
 * 실제 게임/애니의 울음 음원을 사용하지 않고, 음높이 궤적·공명·거친 숨결을 합성한다.
 */
function creatureCry(species: number) {
  const c = audio(), out = masterOut()
  if (!c || !out) return
  const t = c.currentTime + 0.015
  const id = Math.max(1, Math.floor(species))
  const root = 170 + ((id * 53) % 245)
  const length = 0.23 + ((id * 11) % 19) / 100
  const voice = c.createGain()
  const low = c.createBiquadFilter()
  low.type = 'lowpass'; low.Q.value = 1.8
  low.frequency.setValueAtTime(root * 6, t)
  low.frequency.exponentialRampToValueAtTime(root * 2.5, t + length)
  voice.gain.setValueAtTime(0.0001, t)
  voice.gain.exponentialRampToValueAtTime(0.085, t + 0.025)
  voice.gain.setValueAtTime(0.065, t + length * 0.44)
  voice.gain.exponentialRampToValueAtTime(0.0001, t + length)
  voice.connect(low).connect(out)
  for (let i = 0; i < 3; i++) {
    const o = c.createOscillator()
    o.type = i === 0 ? 'sawtooth' : i === 1 ? 'triangle' : 'sine'
    const partial = i === 0 ? 1 : i === 1 ? 1.52 : 2.02
    const bend = (id % 3 === 0 ? 1.36 : id % 3 === 1 ? 0.75 : 1.12)
    o.frequency.setValueAtTime(root * partial * (1 + i * 0.025), t)
    o.frequency.exponentialRampToValueAtTime(root * partial * bend, t + length * 0.55)
    o.frequency.exponentialRampToValueAtTime(root * partial * (0.7 + (id % 5) / 10), t + length)
    const g = c.createGain(); g.gain.value = [0.55, 0.28, 0.12][i]
    o.connect(g).connect(voice)
    o.start(t); o.stop(t + length + 0.01)
  }
  // 작고 부드러운 숨결. 날카로운 백색 잡음이 아니라 저역을 통과시킨 톤.
  const frames = Math.ceil(c.sampleRate * length)
  const buf = c.createBuffer(1, frames, c.sampleRate)
  const wave = buf.getChannelData(0)
  let seed = (id * 1664525 + 1013904223) >>> 0
  for (let j = 0; j < frames; j++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    wave[j] = ((seed / 4294967296) * 2 - 1) * (1 - j / frames)
  }
  const breath = c.createBufferSource(), bFilter = c.createBiquadFilter(), bGain = c.createGain()
  breath.buffer = buf; bFilter.type = 'lowpass'; bFilter.frequency.value = 1300 + id % 900
  bGain.gain.value = 0.016
  breath.connect(bFilter).connect(bGain).connect(out)
  breath.start(t + 0.015)
}

function sparkle(notes: number[]) {
  notes.forEach((n, i) => {
    beep(n, i * 0.055, 0.15, 'sine', 0.055, n * 1.015)
    beep(n * 2, i * 0.055 + 0.01, 0.07, 'triangle', 0.018)
  })
}

export const sfx = {
  select: () => { beep(630, 0, 0.046, 'sine', 0.040, 840); beep(1250, 0.018, 0.065, 'triangle', 0.014) },
  correct: () => sparkle([523, 659, 784]),
  wrong: () => { beep(280, 0, 0.16, 'triangle', 0.06, 200); beep(180, 0.12, 0.24, 'sawtooth', 0.025, 110) },
  hit: () => { noise(0, 0.045, 0.045); beep(220, 0, 0.090, 'triangle', 0.065, 90) },
  superHit: () => { noise(0, 0.095, 0.085); beep(420, 0, 0.20, 'sawtooth', 0.055, 85); beep(620, 0.012, 0.12, 'sine', 0.04, 200) },
  crit: () => { sparkle([784, 988]); beep(250, 0.06, 0.14, 'triangle', 0.060, 150) },
  faint: () => { beep(460, 0, 0.42, 'triangle', 0.07, 104); beep(590, 0.04, 0.27, 'sine', 0.032, 120) },
  /** Fully original punch-punch-crash island-adventure boss explosion cue. No ripped Pokémon audio. */
  finisher: () => {
    bgm.duck(2.1)
    const beats=[0,0.14,0.30,0.41,0.52,0.65,0.79]
    beats.forEach((t,i)=>{
      noise(t,0.11,0.082+(i%3)*.01)
      beep(110+i*29,t,.16,'sawtooth',.043,53+i*11)
      beep(440+i*61,t+.03,.11,'triangle',.037,220+i*19)
    })
    noise(.92,.42,.14)
    beep(165,.91,.62,'sawtooth',.1,43)
    ;[523,659,784,1047].forEach((n,i)=>beep(n,.99+i*.084,.32,'sine',.05,n*1.017))
  },
  tick: () => beep(1100, 0, 0.018, 'sine', 0.023),
  coin: () => sparkle([988, 1319]),
  special: () => { beep(350, 0, 0.18, 'sine', 0.07, 660); beep(700, 0.075, 0.25, 'triangle', 0.065, 1200); sparkle([880, 1175]) },
  step: () => beep(110 + Math.random() * 30, 0, 0.045, 'triangle', 0.025),
  cry: creatureCry,
  // 짧은 효과 음악
  win: () => jingle('win'),
  lose: () => jingle('lose'),
  levelup: () => jingle('levelup'),
  cook: () => jingle('cook'),
}
