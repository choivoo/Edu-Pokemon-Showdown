import { audio, masterOut } from './audio'
import { DRUM_INSTS, NOTE_INSTS } from './instruments'
import { JINGLES, SONGS, STEPS, type JingleName, type Song, type SongName } from './songs'

const indexCache = new WeakMap<Song, Array<Array<{ trackIdx: number; kind: 'note' | 'drum'; midi?: number; dur: number; vel: number }>>>()

/** 곡을 칸(16분음표)별 이벤트 목록으로 바꿔 둔다 */
function indexOf(song: Song) {
  let idx = indexCache.get(song)
  if (!idx) {
    idx = Array.from({ length: song.bars * STEPS }, () => [])
    song.tracks.forEach((tr, ti) => {
      for (const e of tr.events) {
        if (e.step >= idx!.length) continue
        if (tr.kind === 'note') idx![e.step].push({ trackIdx: ti, kind: 'note', midi: (e as { midi: number }).midi, dur: (e as { dur: number }).dur, vel: e.vel })
        else idx![e.step].push({ trackIdx: ti, kind: 'drum', dur: 0, vel: e.vel })
      }
    })
    indexCache.set(song, idx)
  }
  return idx
}

const stepSeconds = (song: Song) => 60 / song.bpm / 4
const swingOffset = (song: Song, step: number) => (step % 2 === 1 ? song.swing * stepSeconds(song) : 0)

/** 한 칸의 소리를 예약한다 */
function playStep(song: Song, ctx: BaseAudioContext, trackOut: GainNode[], pos: number, when: number) {
  const sd = stepSeconds(song)
  for (const e of indexOf(song)[pos]) {
    const tr = song.tracks[e.trackIdx]
    if (e.kind === 'note') NOTE_INSTS[(tr as { inst: keyof typeof NOTE_INSTS }).inst](ctx, trackOut[e.trackIdx], when, e.midi!, e.dur * sd, e.vel)
    else DRUM_INSTS[(tr as { inst: keyof typeof DRUM_INSTS }).inst](ctx, trackOut[e.trackIdx], when, e.vel)
  }
}

function makeTrackBus(song: Song, ctx: BaseAudioContext, dest: AudioNode): GainNode[] {
  return song.tracks.map(tr => { const g = ctx.createGain(); g.gain.value = tr.vol; g.connect(dest); return g })
}

// ---------- 실시간 재생 ----------
class Player {
  readonly out: GainNode
  private timer: ReturnType<typeof setInterval> | null = null
  private step = 0
  private next: number
  private bus: GainNode[]
  done = false

  constructor(readonly song: Song, private ctx: AudioContext, dest: AudioNode, startAt: number, fadeIn = 0.15, private onEnd?: () => void) {
    this.out = ctx.createGain()
    this.out.gain.setValueAtTime(0.0001, startAt)
    this.out.gain.linearRampToValueAtTime(1, startAt + fadeIn)
    this.out.connect(dest)
    this.bus = makeTrackBus(song, ctx, this.out)
    this.next = startAt
    this.timer = setInterval(() => this.tick(), 40)
    this.tick()
  }

  private tick() {
    const total = this.song.bars * STEPS
    const sd = stepSeconds(this.song)
    while (this.next < this.ctx.currentTime + 0.3) {
      const pos = this.step % total
      playStep(this.song, this.ctx, this.bus, pos, this.next + swingOffset(this.song, pos))
      this.step++
      this.next += sd
      if (!this.song.loop && this.step >= total) {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        setTimeout(() => { this.done = true; this.out.disconnect(); this.onEnd?.() }, 1600)
        return
      }
    }
  }

  fadeOut(sec = 0.4) {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    const t = this.ctx.currentTime
    this.out.gain.cancelScheduledValues(t)
    this.out.gain.setValueAtTime(this.out.gain.value, t)
    this.out.gain.linearRampToValueAtTime(0.0001, t + sec)
    setTimeout(() => { try { this.out.disconnect() } catch { /* 이미 끊김 */ } }, sec * 1000 + 100)
  }
}

let current: Player | null = null
let currentName: SongName | '' = ''
let duckGain: GainNode | null = null

function bgmBus(ctx: AudioContext): AudioNode | null {
  const m = masterOut()
  if (!m) return null
  if (!duckGain) { duckGain = ctx.createGain(); duckGain.gain.value = 0.62; duckGain.connect(m) }
  return duckGain
}

export const bgm = {
  get playing(): SongName | '' { return currentName },
  /** 배경음악을 바꾼다. 이미 같은 곡이면 그대로 둔다. */
  play(name: SongName) {
    if (currentName === name && current) return
    const ctx = audio()
    const bus = ctx && bgmBus(ctx)
    if (!ctx || !bus) return
    current?.fadeOut(0.35)
    current = new Player(SONGS[name], ctx, bus, ctx.currentTime + 0.08)
    currentName = name
  },
  stop() {
    current?.fadeOut(0.3)
    current = null
    currentName = ''
  },
  /** 효과 음악이 나오는 동안 배경음악을 줄인다 */
  duck(seconds: number) {
    const ctx = audio()
    if (!ctx || !duckGain) return
    const t = ctx.currentTime
    duckGain.gain.cancelScheduledValues(t)
    duckGain.gain.setValueAtTime(duckGain.gain.value, t)
    duckGain.gain.linearRampToValueAtTime(0.14, t + 0.1)
    duckGain.gain.linearRampToValueAtTime(0.62, t + seconds)
  },
}

/** 짧은 효과 음악(승리/패배/레벨업/요리)을 한 번 재생한다 */
export function jingle(name: JingleName) {
  const ctx = audio()
  const m = masterOut()
  if (!ctx || !m) return
  bgm.duck(name === 'win' || name === 'lose' ? 3.6 : 1.6)
  new Player(JINGLES[name], ctx, m, ctx.currentTime + 0.02, 0.01)
}

// ---------- 오프라인 렌더링 (검수용: 소리를 파형으로 만들어 분석한다) ----------
export async function renderSong(song: Song, seconds?: number, sampleRate = 22050): Promise<Float32Array> {
  const len = seconds ?? song.bars * STEPS * stepSeconds(song) + 1
  const off = new OfflineAudioContext(1, Math.ceil(sampleRate * len), sampleRate)
  const comp = off.createDynamicsCompressor()
  comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 5
  const master = off.createGain(); master.gain.value = 0.85
  master.connect(comp).connect(off.destination)
  const bus = makeTrackBus(song, off, master)
  const total = song.bars * STEPS
  for (let s = 0; s < total; s++) {
    const t = s * stepSeconds(song) + swingOffset(song, s)
    if (t < len) playStep(song, off, bus, s, t)
  }
  return (await off.startRendering()).getChannelData(0)
}
