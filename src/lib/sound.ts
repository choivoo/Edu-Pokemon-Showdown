// Web Audio API로 8비트풍 효과음을 직접 생성한다. (외부 음원 파일 없음)
let ctx: AudioContext | null = null
let muted = false

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function beep(freq: number, start: number, dur: number, type: OscillatorType = 'square', vol = 0.08, slideTo?: number) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + start
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  gain.gain.setValueAtTime(vol, t0)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur)
}

function noise(start: number, dur: number, vol = 0.1) {
  const c = audio()
  if (!c) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  const gain = c.createGain()
  gain.gain.value = vol
  src.buffer = buf
  src.connect(gain).connect(c.destination)
  src.start(c.currentTime + start)
}

const play = (fn: () => void) => { if (!muted) fn() }

export const sfx = {
  select: () => play(() => beep(660, 0, 0.06)),
  correct: () => play(() => { beep(523, 0, 0.1); beep(659, 0.1, 0.1); beep(784, 0.2, 0.16) }),
  wrong: () => play(() => { beep(220, 0, 0.15, 'sawtooth'); beep(150, 0.15, 0.25, 'sawtooth') }),
  hit: () => play(() => { noise(0, 0.15); beep(200, 0, 0.12, 'square', 0.08, 80) }),
  superHit: () => play(() => { noise(0, 0.25, 0.14); beep(300, 0, 0.2, 'square', 0.1, 60) }),
  crit: () => play(() => { beep(880, 0, 0.06); beep(1180, 0.06, 0.12) }),
  faint: () => play(() => beep(400, 0, 0.6, 'triangle', 0.1, 60)),
  win: () => play(() => [523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.14, 0.2))),
  lose: () => play(() => [392, 330, 262, 196].forEach((f, i) => beep(f, i * 0.2, 0.3, 'triangle'))),
  tick: () => play(() => beep(900, 0, 0.03, 'square', 0.04)),
  coin: () => play(() => { beep(988, 0, 0.07); beep(1319, 0.07, 0.16) }),
  special: () => play(() => { beep(440, 0, 0.08); beep(660, 0.06, 0.08); beep(880, 0.12, 0.2, 'square', 0.09, 1320) }),
  cook: () => play(() => [392, 523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.09, 0.14, 'triangle', 0.09))),
  levelup: () => play(() => [523, 659, 784, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.08, 0.14))),
  step: () => play(() => beep(130 + Math.random() * 30, 0, 0.05, 'triangle', 0.05)),
}

// ---- 간단한 8비트 배경음악 (음원 파일 없이 오실레이터로 생성) ----
type Song = { bpm: number; lead: number[]; bass: number[]; wave: OscillatorType }
const N = (n: number) => 440 * Math.pow(2, (n - 69) / 12) // MIDI 번호 → Hz
const SONGS: Record<string, Song> = {
  camp: { bpm: 96, wave: 'triangle', lead: [72, 0, 76, 0, 79, 0, 76, 0, 77, 0, 74, 0, 72, 0, 0, 0, 74, 0, 77, 0, 81, 0, 77, 0, 76, 0, 72, 0, 67, 0, 0, 0], bass: [48, 0, 55, 0, 53, 0, 55, 0, 52, 0, 55, 0, 50, 0, 55, 0] },
  battle: { bpm: 150, wave: 'square', lead: [69, 72, 76, 72, 69, 72, 76, 81, 67, 71, 74, 71, 67, 71, 74, 79, 65, 69, 72, 69, 65, 69, 72, 77, 67, 71, 74, 79, 76, 74, 71, 67], bass: [45, 45, 45, 45, 43, 43, 43, 43, 41, 41, 41, 41, 43, 43, 43, 43] },
  story: { bpm: 72, wave: 'triangle', lead: [64, 0, 0, 0, 67, 0, 0, 0, 71, 0, 0, 0, 69, 0, 0, 0], bass: [40, 0, 0, 0, 43, 0, 0, 0] },
}
let bgmTimer: ReturnType<typeof setInterval> | null = null
let bgmName = ''

export const bgm = {
  play(name: keyof typeof SONGS) {
    if (bgmName === name && bgmTimer) return
    bgm.stop()
    bgmName = name
    const song = SONGS[name]
    const stepMs = (60000 / song.bpm) / 2
    let i = 0
    bgmTimer = setInterval(() => {
      if (muted) return
      const l = song.lead[i % song.lead.length]
      const b = song.bass[Math.floor(i / 2) % song.bass.length]
      if (l) beep(N(l), 0, (stepMs / 1000) * 0.9, song.wave, 0.025)
      if (i % 2 === 0 && b) beep(N(b), 0, (stepMs / 1000) * 1.8, 'triangle', 0.04)
      i++
    }, stepMs)
  },
  stop() {
    if (bgmTimer) clearInterval(bgmTimer)
    bgmTimer = null
    bgmName = ''
  },
}

export function setMuted(m: boolean) { muted = m }
export function isMuted() { return muted }
