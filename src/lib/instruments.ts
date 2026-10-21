// 오실레이터와 노이즈만으로 만든 악기들. 실시간 재생과 오프라인 렌더링 모두 같은 코드를 쓴다.
export type Ctx = BaseAudioContext

export const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

const noiseCache = new WeakMap<BaseAudioContext, AudioBuffer>()
function noiseBuf(ctx: Ctx): AudioBuffer {
  let b = noiseCache.get(ctx)
  if (!b) {
    b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = b.getChannelData(0)
    let s = 12345
    for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1 }
    noiseCache.set(ctx, b)
  }
  return b
}

const pulseCache = new WeakMap<BaseAudioContext, Record<number, PeriodicWave>>()
/** 듀티비 duty 의 펄스파 (25% 는 가늘고 밝은 소리) */
function pulse(ctx: Ctx, duty: number): PeriodicWave {
  let m = pulseCache.get(ctx)
  if (!m) { m = {}; pulseCache.set(ctx, m) }
  const key = Math.round(duty * 100)
  if (!m[key]) {
    const n = 48
    const real = new Float32Array(n), imag = new Float32Array(n)
    for (let k = 1; k < n; k++) imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty)
    m[key] = ctx.createPeriodicWave(real, imag)
  }
  return m[key]
}

function env(g: GainNode, t: number, peak: number, attack: number, hold: number, release: number) {
  g.gain.cancelScheduledValues(t)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.setValueAtTime(peak, t + attack + hold)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release)
}

function osc(ctx: Ctx, type: OscillatorType | PeriodicWave, f: number, t0: number, t1: number, dest: AudioNode, detune = 0): OscillatorNode {
  const o = ctx.createOscillator()
  if (typeof type === 'string') o.type = type as Exclude<OscillatorType, 'custom'>
  else o.setPeriodicWave(type)
  o.frequency.setValueAtTime(f, t0)
  o.detune.value = detune
  o.connect(dest)
  o.start(t0)
  o.stop(t1)
  return o
}

export type NoteInst = (ctx: Ctx, dest: AudioNode, t: number, midi: number, dur: number, vel: number) => void
export type DrumInst = (ctx: Ctx, dest: AudioNode, t: number, vel: number) => void

// ---------- 음정 악기 ----------
/** 마림바: 짧게 울리는 통통 튀는 소리 */
export const marimba: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.28, Math.min(dur * 1.1, 0.7))
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.34 * vel, 0.002, 0, len)
  osc(ctx, 'sine', f, t, t + len + 0.05, g)
  const h = ctx.createGain(); h.connect(g)
  env(h, t, 0.28, 0.001, 0, 0.09)
  osc(ctx, 'sine', f * 4, t, t + 0.15, h)
  const h2 = ctx.createGain(); h2.connect(g)
  env(h2, t, 0.1, 0.001, 0, 0.04)
  osc(ctx, 'sine', f * 9.2, t, t + 0.08, h2)
}

/** 신스 플럭: 통통한 베이스/아르페지오용 */
export const pluck: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.12, Math.min(dur, 0.4))
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 5
  lp.frequency.setValueAtTime(Math.min(5200, f * 9), t)
  lp.frequency.exponentialRampToValueAtTime(Math.max(180, f * 1.3), t + len)
  const g = ctx.createGain()
  lp.connect(g).connect(dest)
  env(g, t, 0.3 * vel, 0.004, Math.max(0, len - 0.05), 0.08)
  osc(ctx, 'sawtooth', f, t, t + len + 0.2, lp)
  osc(ctx, 'square', f / 2, t, t + len + 0.2, lp, 4)
}

/** 서브 베이스: 낮고 둥근 소리 */
export const subBass: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.1, dur)
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.42 * vel, 0.006, Math.max(0, len - 0.06), 0.07)
  osc(ctx, 'triangle', f, t, t + len + 0.2, g)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600
  const g2 = ctx.createGain(); lp.connect(g2).connect(g)
  env(g2, t, 0.35, 0.004, Math.max(0, len - 0.06), 0.07)
  osc(ctx, 'sawtooth', f, t, t + len + 0.2, lp)
}

/** 리드: 가는 펄스파 + 비브라토 */
export const lead: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.08, dur)
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.17 * vel, 0.008, Math.max(0, len - 0.1), 0.1)
  const o = osc(ctx, pulse(ctx, 0.25), f, t, t + len + 0.25, g)
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5.6
  const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.012, t + 0.18)
  lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + len + 0.25)
  osc(ctx, 'square', f, t, t + len + 0.25, g, 9)
}

/** 플루트: 부드러운 사인 + 숨소리 */
export const flute: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.12, dur)
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.26 * vel, 0.05, Math.max(0, len - 0.12), 0.12)
  const o = osc(ctx, 'sine', f, t, t + len + 0.3, g)
  const lfo = ctx.createOscillator(); lfo.frequency.value = 5
  const lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.008, t + 0.25)
  lfo.connect(lg).connect(o.frequency); lfo.start(t); lfo.stop(t + len + 0.3)
  osc(ctx, 'sine', f * 2, t, t + len + 0.3, g)
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 4
  const ng = ctx.createGain(); n.connect(bp).connect(ng).connect(dest)
  env(ng, t, 0.025 * vel, 0.03, Math.max(0, len - 0.1), 0.1)
  n.start(t); n.stop(t + len + 0.3)
}

/** 패드: 겹친 톱니파를 부드럽게 */
export const pad: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.2, dur)
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.7
  const g = ctx.createGain(); lp.connect(g).connect(dest)
  env(g, t, 0.08 * vel, 0.12, Math.max(0, len - 0.2), 0.4)
  osc(ctx, 'sawtooth', f, t, t + len + 0.6, lp, -8)
  osc(ctx, 'sawtooth', f, t, t + len + 0.6, lp, 8)
}

/** 브라스 스탭: 밝게 터지는 짧은 화음 */
export const brass: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.1, Math.min(dur, 0.5))
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2
  lp.frequency.setValueAtTime(700, t)
  lp.frequency.exponentialRampToValueAtTime(3200, t + 0.06)
  lp.frequency.exponentialRampToValueAtTime(1200, t + len)
  const g = ctx.createGain(); lp.connect(g).connect(dest)
  env(g, t, 0.14 * vel, 0.008, Math.max(0, len - 0.1), 0.12)
  osc(ctx, 'sawtooth', f, t, t + len + 0.3, lp, -6)
  osc(ctx, 'sawtooth', f, t, t + len + 0.3, lp, 6)
}

/** 종: 반짝이는 장식음(아르페지오용) */
export const bell: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f = hz(midi), len = Math.max(0.3, Math.min(dur * 1.5, 0.8))
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.16 * vel, 0.002, 0, len)
  osc(ctx, 'triangle', f, t, t + len + 0.05, g)
  const h = ctx.createGain(); h.connect(g); env(h, t, 0.5, 0.001, 0, 0.25)
  osc(ctx, 'sine', f * 2.76, t, t + 0.3, h)
}

// ---------- 드럼 ----------
export const kick: DrumInst = (ctx, dest, t, vel) => {
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.85 * vel, 0.002, 0, 0.2)
  const o = ctx.createOscillator(); o.type = 'sine'
  o.frequency.setValueAtTime(170, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12)
  o.connect(g); o.start(t); o.stop(t + 0.25)
  const c = ctx.createGain(); c.connect(dest); env(c, t, 0.2 * vel, 0.001, 0, 0.02)
  osc(ctx, 'square', 900, t, t + 0.03, c)
}
export const snare: DrumInst = (ctx, dest, t, vel) => {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2100; bp.Q.value = 0.8
  const g = ctx.createGain(); n.connect(bp).connect(g).connect(dest)
  env(g, t, 0.5 * vel, 0.001, 0.02, 0.13)
  n.start(t, 0.1); n.stop(t + 0.25)
  const tg = ctx.createGain(); tg.connect(dest); env(tg, t, 0.3 * vel, 0.001, 0, 0.09)
  const o = osc(ctx, 'triangle', 210, t, t + 0.12, tg)
  o.frequency.exponentialRampToValueAtTime(140, t + 0.1)
}
export const clap: DrumInst = (ctx, dest, t, vel) => {
  for (let i = 0; i < 3; i++) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 1.2
    const g = ctx.createGain(); n.connect(bp).connect(g).connect(dest)
    env(g, t + i * 0.012, 0.4 * vel, 0.001, 0, i === 2 ? 0.14 : 0.02)
    n.start(t + i * 0.012, 0.3); n.stop(t + 0.25)
  }
}
export const hat: DrumInst = (ctx, dest, t, vel) => {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7200
  const g = ctx.createGain(); n.connect(hp).connect(g).connect(dest)
  env(g, t, 0.22 * vel, 0.001, 0, 0.045)
  n.start(t, 0.5); n.stop(t + 0.1)
}
export const openHat: DrumInst = (ctx, dest, t, vel) => {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6500
  const g = ctx.createGain(); n.connect(hp).connect(g).connect(dest)
  env(g, t, 0.2 * vel, 0.001, 0.03, 0.16)
  n.start(t, 0.2); n.stop(t + 0.3)
}
export const shaker: DrumInst = (ctx, dest, t, vel) => {
  const n = ctx.createBufferSource(); n.buffer = noiseBuf(ctx)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5500; bp.Q.value = 1.4
  const g = ctx.createGain(); n.connect(bp).connect(g).connect(dest)
  env(g, t, 0.13 * vel, 0.012, 0, 0.05)
  n.start(t, 0.7); n.stop(t + 0.1)
}
export const rim: DrumInst = (ctx, dest, t, vel) => {
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.2 * vel, 0.001, 0, 0.03)
  osc(ctx, 'square', 1750, t, t + 0.05, g)
  const g2 = ctx.createGain(); g2.connect(dest); env(g2, t, 0.14 * vel, 0.001, 0, 0.05)
  osc(ctx, 'triangle', 820, t, t + 0.07, g2)
}
export const tom: DrumInst = (ctx, dest, t, vel) => {
  const g = ctx.createGain(); g.connect(dest)
  env(g, t, 0.55 * vel, 0.002, 0, 0.22)
  const o = ctx.createOscillator(); o.type = 'sine'
  o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(95, t + 0.18)
  o.connect(g); o.start(t); o.stop(t + 0.3)
}


/** 관을 부드럽게 울리는 오카리나 음색 — 홀수 배음과 느린 비브라토. */
export const ocarina: NoteInst = (ctx, dest, t, midi, dur, vel) => {
  const f=hz(midi), len=Math.max(0.2,dur)
  const g=ctx.createGain(); g.connect(dest)
  env(g,t,0.2*vel,0.065,Math.max(0,len-0.15),0.16)
  const o=osc(ctx,'sine',f,t,t+len+0.4,g)
  const vibr=ctx.createOscillator();vibr.frequency.value=5.2
  const depth=ctx.createGain();depth.gain.setValueAtTime(0,t);depth.gain.linearRampToValueAtTime(f*0.004,t+0.25)
  vibr.connect(depth).connect(o.frequency);vibr.start(t);vibr.stop(t+len+0.4)
  const third=ctx.createGain();third.gain.value=0.12;third.connect(g)
  osc(ctx,'sine',f*3,t,t+len+0.3,third)
}
/** 칼림바: 탄성 있는 목재 울림을 위해 서로 다른 배음의 감쇠 시간을 따로 준다. */
export const kalimba: NoteInst = (ctx,dest,t,midi,dur,vel) => {
  const f=hz(midi),len=Math.max(0.3,Math.min(dur+0.25,1.25))
  for(const [ratio,amp,decay] of [[1,0.3,1],[2.01,0.1,0.35],[5.8,0.055,0.12]]){
    const g=ctx.createGain();g.connect(dest)
    env(g,t,amp*vel,0.002,0,len*decay)
    osc(ctx,'sine',f*ratio,t,t+len*decay+0.04,g)
  }
}
/** 하프: 밝게 뜯는 시작음과 저역 공명, 음이 내려가며 잔향이 남는다. */
export const harp: NoteInst = (ctx,dest,t,midi,dur,vel) => {
  const f=hz(midi),len=Math.max(0.27,Math.min(1.15,dur*1.7))
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(Math.min(8000,f*12),t)
  lp.frequency.exponentialRampToValueAtTime(Math.max(350,f*1.5),t+len)
  const g=ctx.createGain();lp.connect(g).connect(dest)
  env(g,t,0.17*vel,0.002,0,len)
  osc(ctx,'triangle',f,t,t+len+0.09,lp)
  const high=ctx.createGain();high.connect(g)
  env(high,t,0.38,0.002,0,Math.min(0.2,len))
  osc(ctx,'sine',f*2.002,t,t+0.3,high)
}
/** 현악기: 움직이는 저역통과 필터와 약한 디튠으로 현의 울림 표현. */
export const strings: NoteInst = (ctx,dest,t,midi,dur,vel) => {
  const f=hz(midi),len=Math.max(0.4,dur)
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1900;lp.Q.value=0.8
  const g=ctx.createGain();lp.connect(g).connect(dest)
  env(g,t,0.10*vel,0.16,Math.max(0,len-0.24),0.36)
  osc(ctx,'sawtooth',f,t,t+len+0.6,lp,-6)
  osc(ctx,'sawtooth',f,t,t+len+0.6,lp,6)
  const body=ctx.createGain();body.gain.value=0.28;body.connect(lp)
  osc(ctx,'triangle',f/2,t,t+len+0.55,body)
}
/** 수정종: 맑고 낮은 울림이 고르게 퍼지는 잔향 악기. */
export const crystal: NoteInst = (ctx,dest,t,midi,dur,vel) => {
  const f=hz(midi),len=Math.max(0.8,Math.min(2.3,dur+0.85))
  for(const [harm,amp,dec] of [[1,0.15,1],[2.01,0.075,0.65],[2.68,0.035,0.4],[5.38,0.021,0.2]]){
    const g=ctx.createGain();g.connect(dest)
    env(g,t,amp*vel,0.004,0,len*dec)
    osc(ctx,'sine',f*harm,t,t+len*dec+0.05,g)
  }
}
/** 부드러운 금관: 음 시작이 찢어지지 않도록 필터가 단계적으로 열린다. */
export const horn: NoteInst = (ctx,dest,t,midi,dur,vel) => {
  const f=hz(midi),len=Math.max(0.2,dur)
  const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.Q.value=1.5
  lp.frequency.setValueAtTime(430,t);lp.frequency.linearRampToValueAtTime(1550,t+0.12)
  const g=ctx.createGain();lp.connect(g).connect(dest)
  env(g,t,0.17*vel,0.06,Math.max(0,len-0.19),0.2)
  osc(ctx,'sawtooth',f,t,t+len+0.4,lp)
  osc(ctx,'triangle',f*2,t,t+len+0.4,lp,3)
}

export const NOTE_INSTS = { marimba, pluck, subBass, lead, flute, pad, brass, bell, ocarina, kalimba, harp, strings, crystal, horn } as const
export const DRUM_INSTS = { kick, snare, clap, hat, openHat, shaker, rim, tom } as const
export type NoteInstName = keyof typeof NOTE_INSTS
export type DrumInstName = keyof typeof DRUM_INSTS
