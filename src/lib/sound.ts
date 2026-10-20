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
}

export function setMuted(m: boolean) { muted = m }
export function isMuted() { return muted }
