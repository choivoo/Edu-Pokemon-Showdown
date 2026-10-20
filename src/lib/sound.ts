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

export const sfx = {
  select: () => beep(660, 0, 0.06),
  correct: () => { beep(523, 0, 0.1); beep(659, 0.1, 0.1); beep(784, 0.2, 0.16) },
  wrong: () => { beep(220, 0, 0.15, 'sawtooth'); beep(150, 0.15, 0.25, 'sawtooth') },
  hit: () => { noise(0, 0.15); beep(200, 0, 0.12, 'square', 0.08, 80) },
  superHit: () => { noise(0, 0.25, 0.14); beep(300, 0, 0.2, 'square', 0.1, 60) },
  crit: () => { beep(880, 0, 0.06); beep(1180, 0.06, 0.12) },
  faint: () => beep(400, 0, 0.6, 'triangle', 0.1, 60),
  tick: () => beep(900, 0, 0.03, 'square', 0.04),
  coin: () => { beep(988, 0, 0.07); beep(1319, 0.07, 0.16) },
  special: () => { beep(440, 0, 0.08); beep(660, 0.06, 0.08); beep(880, 0.12, 0.2, 'square', 0.09, 1320) },
  step: () => beep(130 + Math.random() * 30, 0, 0.05, 'triangle', 0.05),
  // 짧은 효과 음악
  win: () => jingle('win'),
  lose: () => jingle('lose'),
  levelup: () => jingle('levelup'),
  cook: () => jingle('cook'),
}
