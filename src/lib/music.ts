import { audio, masterOut } from './audio'
import { DRUM_INSTS, NOTE_INSTS } from './instruments'
import { JINGLES, SONGS, STEPS, type JingleName, type Song, type SongName } from './songs'
import { QUEST_ALBUM_CUES, QUEST_ALBUM_BUNDLE_PATH, type QuestAlbumCue } from './questAlbum'

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
/** The 27 cue times are source-of-truth for both player-loaded and bundled audio. */
const DEFAULT_CUES:Record<SongName,QuestAlbumCue>={
 title:'title',camp:'camp',map:'expeditions',battle:'firstSteppe',
 boss:'boss1',story:'storyTalk',tide:'backforthBrook',
 grove:'gloomyGrove',echo:'happenstanceCave',spark:'parchedPeak',
 ember:'pincushionPlain',astral:'happenstanceGrassland',
}
export const LOCAL_CUES:Record<SongName,{start:number;end:number}>=Object.fromEntries(
 Object.entries(DEFAULT_CUES).map(([key,value])=>{
  const [start,end]=QUEST_ALBUM_CUES[value]
  return [key,{start,end}]
 })
) as Record<SongName,{start:number;end:number}>
let localAudio:HTMLAudioElement|null=null
let localBlobUrl:string|null=null
let bundledAudio:HTMLAudioElement|null=null
let currentCue:QuestAlbumCue='title'
let activeLocalCue:{start:number;end:number}|null=null
let sourceKind:'synth'|'local'|'bundled'='synth'
let publicSoundtrackProbe:Promise<boolean>|null=null
function musicElement() {return localAudio??bundledAudio}
function cueBounds(cue:QuestAlbumCue) {
 const [start,end]=QUEST_ALBUM_CUES[cue]
 return {start,end}
}
function attachPlayer(player:HTMLAudioElement) {
 const ctx=audio(),bus=ctx&&bgmBus(ctx)
 if(!ctx||!bus)return false
 ctx.createMediaElementSource(player).connect(bus)
 player.preload='metadata'
 player.addEventListener('timeupdate',()=>{
  if (!activeLocalCue || musicElement()!==player) return
  const t=player.currentTime
  if (t >= activeLocalCue.end-.06 || t < activeLocalCue.start-1)
    player.currentTime=activeLocalCue.start
 })
 return true
}

function bgmBus(ctx: AudioContext): AudioNode | null {
  const m = masterOut()
  if (!m) return null
  if (!duckGain) { duckGain = ctx.createGain(); duckGain.gain.value = 0.62; duckGain.connect(m) }
  return duckGain
}

export const bgm = {
  get playing(): SongName | '' {return currentName},
  get playingAlbumCue(): QuestAlbumCue {return currentCue},
  get localMusicActive():boolean {return sourceKind==='local'},
  get bundledMusicActive():boolean {return sourceKind==='bundled'},
  get musicSource(): 'synth'|'local'|'bundled' {return sourceKind},

  /**
   * A correctly licensed audio recording may be placed at
   * public/music/quest-complete.mp3 and will stream automatically
   * on any device visiting GitHub Pages. No upload is performed here.
   */
  autoUseBundledAlbum():Promise<boolean> {
    if(sourceKind==='local') return Promise.resolve(false)
    if(bundledAudio) return Promise.resolve(true)
    if(publicSoundtrackProbe)return publicSoundtrackProbe
    publicSoundtrackProbe=(async ()=>{
      const url=new URL(import.meta.env.BASE_URL+QUEST_ALBUM_BUNDLE_PATH,window.location.origin)
      try {
        const res=await fetch(url,{method:'HEAD',cache:'no-cache'})
        const len=Number(res.headers.get('content-length')||'0')
        const type=res.headers.get('content-type')||''
        if(!res.ok || len<64_000 || (/text\/html/i.test(type)))return false
        if(localAudio)return false
        const player=new Audio(url.toString())
        if(!attachPlayer(player))return false
        bundledAudio=player;sourceKind='bundled'
        const name=currentName || 'title',cue=currentCue
        currentName=''
        this.play(name,cue)
        return true
      }catch{return false}
    })()
    return publicSoundtrackProbe
  },
  /** Local music is an optional override and stays in this browser only. */
  useLocalFile(file:File):boolean {
    if(!file || !(file.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(file.name)))return false
    const selected=currentName||'title',cue=currentCue
    localAudio?.pause()
    if(localAudio){localAudio.removeAttribute('src');localAudio.load()}
    if(localBlobUrl)URL.revokeObjectURL(localBlobUrl)
    localBlobUrl=URL.createObjectURL(file)
    const player=new Audio(localBlobUrl)
    if(!attachPlayer(player)){URL.revokeObjectURL(localBlobUrl);localBlobUrl=null;return false}
    bundledAudio?.pause()
    localAudio=player;sourceKind='local'
    current?.fadeOut(.25);current=null;currentName=''
    this.play(selected,cue)
    return true
  },
  disableLocalFile() {
    const previous=currentName||'title',cue=currentCue
    localAudio?.pause()
    if(localAudio){localAudio.removeAttribute('src');localAudio.load()}
    localAudio=null;activeLocalCue=null
    if(localBlobUrl)URL.revokeObjectURL(localBlobUrl)
    localBlobUrl=null
    sourceKind=bundledAudio?'bundled':'synth'
    currentName=''
    this.play(previous,cue)
    if(!bundledAudio)void this.autoUseBundledAlbum()
  },
  /** Change musical scene. Correct album segment plays when audio is available. */
  play(name:SongName,cue:QuestAlbumCue=DEFAULT_CUES[name]) {
    if(currentName===name && currentCue===cue && (current||musicElement()))return
    currentCue=cue
    const player=musicElement()
    if(player){
      const bounds=cueBounds(cue)
      activeLocalCue=bounds
      current?.fadeOut(.15);current=null
      const seek=()=>{
        if(musicElement()===player && activeLocalCue===bounds){
          const limit=Number.isFinite(player.duration)?player.duration:4524.225
          player.currentTime=Math.min(bounds.start,Math.max(0,limit-1))
        }
      }
      if(player.readyState>=1)seek()
      else player.addEventListener('loadedmetadata',seek,{once:true})
      void player.play().catch(()=>{/* mobile browser may require the next click */})
      currentName=name
      return
    }
    const ctx=audio(),bus=ctx&&bgmBus(ctx)
    if(!ctx||!bus)return
    current?.fadeOut(.35)
    current=new Player(SONGS[name],ctx,bus,ctx.currentTime+.08)
    currentName=name
    sourceKind='synth'
  },
  stop() {
    musicElement()?.pause()
    current?.fadeOut(.3)
    current=null
    currentName=''
  },
  /** Lower both personal and bundled soundtrack under sound effects. */
  duck(seconds:number) {
    const ctx=audio()
    if(!ctx||!duckGain)return
    const t=ctx.currentTime
    duckGain.gain.cancelScheduledValues(t)
    duckGain.gain.setValueAtTime(duckGain.gain.value,t)
    duckGain.gain.linearRampToValueAtTime(.14,t+.1)
    duckGain.gain.linearRampToValueAtTime(.62,t+Math.max(.2,seconds))
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
