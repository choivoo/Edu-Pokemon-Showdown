import { audio, masterOut } from './audio'
import { DRUM_INSTS, NOTE_INSTS } from './instruments'
import { JINGLES, SONGS, STEPS, type JingleName, type Song, type SongName } from './songs'
import { SOUNDTRACK_CUES, type TrackCue } from './officialCueMap'

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
/** Timecodes provided by the user for a locally selected soundtrack.
 * The MP3 stays on the player's own device; it is NEVER uploaded to GitHub.
 * This does not claim public redistribution rights over official game tracks.
 */
export interface OstMarker {title:string;start:number;end:number}
const toSeconds=(time:string)=>time.split(':').reduce((n,t)=>n*60+Number(t),0)
const MARKERS:[string,string][]=[
 ['0:00','Title'],['2:38','Intro'],['4:44','Tutorial'],['6:30','Expedition Results'],
 ['7:18','Base Camp'],['9:40','Expeditions'],['11:24','First Steppe'],
 ['13:18','Boss Battle 1'],['15:14','Story Talk'],['15:43','Boss Battle 2'],
 ['17:27','Gloomy Grove'],['21:00','Backforth Brook'],['24:43','Parched Peak'],
 ['27:54','Belly Button Cave'],['30:28','Pincushion Plain'],['33:42','Miasma Moor'],
 ['36:39','Hushed Highlands'],['40:12','Nightlight Nook'],['44:16','Farside Fjord'],
 ['48:18','Story Emergency'],['49:03','Mewtwo Battle'],['52:13','Staff Roll'],
 ['54:48','Happenstance Island — Grassland'],['58:14','Happenstance Island — Waterside'],
 ['1:02:23','Happenstance Island — Cave'],['1:07:39','Happenstance Island — Forest'],
 ['1:10:47','Happenstance Island — Mountain']
]
export const OST_TRACKLIST: OstMarker[]=MARKERS.map(([start,title],i)=>({
 title,start:toSeconds(start),end:i<MARKERS.length-1?toSeconds(MARKERS[i+1][0]):Number.POSITIVE_INFINITY
}))
const CUE_INDEX:Record<SongName,number>={
 title:0,camp:4,map:5,battle:6,boss:7,story:8,
 tide:11,grove:10,echo:13,spark:14,ember:12,astral:22,
}
export const LOCAL_CUES:Record<SongName,{start:number;end:number}>=Object.fromEntries(
 (Object.entries(CUE_INDEX) as [SongName,number][]).map(([name,index])=>[name,OST_TRACKLIST[index]])
) as unknown as Record<SongName,{start:number;end:number}>

let localAudio:HTMLAudioElement|null=null
let localBlobUrl:string|null=null
let activeLocalCue:{start:number;end:number}|null=null
let activeLocalIndex=-1
let sceneCue:TrackCue|null=null
let remoteChecked=false
let sharedMode=false
const PART_STARTS=[0,1260,2412,3494] as const
const partIndex=(n:number)=>n>=3494?3:n>=2412?2:n>=1260?1:0
const partUrl=(n:number)=>import.meta.env.BASE_URL+'audio/quest-part-'+(n+1)+'.mp3'
const toScene=(name:SongName):TrackCue=>({
  title:'title',camp:'camp',map:'expeditions',battle:'firstSteppe',boss:'boss1',
  story:'storyTalk',tide:'brook',grove:'gloom',echo:'cave',spark:'peak',
  ember:'plain',astral:'happenGrass'
} satisfies Record<SongName,TrackCue>)[name]

function startChapter(player:HTMLAudioElement,start:number,end:number){
 const index=partIndex(start)
 const offset=sharedMode ? PART_STARTS[index] : 0
 if(sharedMode){
   const desired=partUrl(index)
   if(!player.src.endsWith(desired)){player.src=desired;player.load()}
 }
 activeLocalCue={start:start-offset,end:end-offset}
 const cue=activeLocalCue
 const seek=()=>{if(activeLocalCue===cue)player.currentTime=cue.start}
 if(player.readyState>=1)seek()
 else player.addEventListener('loadedmetadata',seek,{once:true})
 void player.play().catch(()=>{/* mobile browsers require a first tap */})
}



function bgmBus(ctx: AudioContext): AudioNode | null {
  const m = masterOut()
  if (!m) return null
  if (!duckGain) { duckGain = ctx.createGain(); duckGain.gain.value = 0.62; duckGain.connect(m) }
  return duckGain
}

export const bgm = {
  get playing(): SongName | '' { return currentName },
  get localMusicActive():boolean {return !!localAudio},
  /** Playback is a device-local opt-in; no user MP3 is included in the public app. */
  useLocalFile(file:File):boolean {
    if(!file || !(file.type.startsWith('audio/') || /\\.(mp3|m4a|ogg|wav)$/i.test(file.name)))return false
    const ctx=audio(),bus=ctx&&bgmBus(ctx)
    if(!ctx||!bus)return false
    const selected=currentName || 'title'
    localAudio?.pause()
    if(localAudio){localAudio.removeAttribute('src');localAudio.load()}
    if(localBlobUrl)URL.revokeObjectURL(localBlobUrl)
    localBlobUrl=URL.createObjectURL(file)
    const player=new Audio(localBlobUrl)
    const node=ctx.createMediaElementSource(player)
    node.connect(bus)
    localAudio=player
    sharedMode=false
    activeLocalIndex=-1
    player.preload='auto'
    player.addEventListener('timeupdate',()=>{
      if(!activeLocalCue)return
      const t=player.currentTime
      if(t>=activeLocalCue.end-0.06||t<activeLocalCue.start-1)
        player.currentTime=activeLocalCue.start
    })
    current?.fadeOut(0.2);current=null;currentName=''
    this.play(selected)
    return true
  },
  disableLocalFile() {
    const previous=currentName || 'title'
    localAudio?.pause()
    if(localAudio){localAudio.removeAttribute('src');localAudio.load()}
    localAudio=null;activeLocalCue=null;activeLocalIndex=-1;sharedMode=false
    if(localBlobUrl)URL.revokeObjectURL(localBlobUrl)
    localBlobUrl=null;currentName=''
    this.play(previous)
  },
  /** No file picker: use the same hosted four-part licensed soundtrack on every device. */
  enableSharedMusic(){
    if(remoteChecked)return
    remoteChecked=true
    void fetch(partUrl(0),{method:'HEAD'}).then(res=>{
      if(!res.ok||localAudio)return
      const ctx=audio(),bus=ctx&&bgmBus(ctx)
      if(!ctx||!bus)return
      const player=new Audio(partUrl(0))
      player.crossOrigin='anonymous'
      player.preload='auto'
      ctx.createMediaElementSource(player).connect(bus)
      player.addEventListener('timeupdate',()=>{
        if(!activeLocalCue)return
        if(player.currentTime>=activeLocalCue.end-.1 ||
           player.currentTime<activeLocalCue.start-.5)player.currentTime=activeLocalCue.start
      })
      player.addEventListener('error',()=>{
        if(localAudio!==player)return
        localAudio=null;activeLocalCue=null;sharedMode=false;currentName=''
        this.play('camp')
      })
      localAudio=player;sharedMode=true
      const selected=sceneCue??toScene(currentName||'title')
      const fallback=currentName||'title'
      current?.fadeOut(.25);current=null;currentName=''
      this.playCue(selected,fallback)
    }).catch(()=>{/* original synthesized tracks remain available */})
  },
  playTrack(index:number,fallback:SongName='battle'){
    const track=OST_TRACKLIST[index]
    if(!track){this.play(fallback);return}
    sceneCue=(Object.keys(SOUNDTRACK_CUES) as TrackCue[]).find(k=>SOUNDTRACK_CUES[k][0]===track.start)??null
    if(!localAudio){this.play(fallback);return}
    const same=activeLocalIndex===index&&currentName===fallback&&!localAudio.paused
    if(same)return
    activeLocalIndex=index
    current?.fadeOut(.18);current=null
    startChapter(localAudio,track.start,Number.isFinite(track.end)?track.end:4524.23)
    currentName=fallback
  },
  playCue(cue:TrackCue,fallback:SongName='battle'){
    sceneCue=cue
    if(!remoteChecked)this.enableSharedMusic()
    if(!localAudio){
      this.play(fallback)
      sceneCue=cue
      return
    }
    const range=SOUNDTRACK_CUES[cue]
    if(currentName===fallback&&activeLocalCue &&
       activeLocalCue.start === range[0]-(sharedMode?PART_STARTS[partIndex(range[0])]:0) &&
       !localAudio.paused)return
    activeLocalIndex=-1
    current?.fadeOut(.18);current=null
    startChapter(localAudio,range[0],range[1])
    currentName=fallback
  },
  play(name:SongName){
    sceneCue=toScene(name)
    if(!remoteChecked)this.enableSharedMusic()
    if(currentName===name && activeLocalIndex===-1&&(current || (localAudio&&!localAudio.paused)))return
    activeLocalIndex=-1
    if(localAudio){
      current?.fadeOut(.15);current=null
      const range=LOCAL_CUES[name]
      startChapter(localAudio,range.start,range.end)
      currentName=name
      return
    }
    const ctx=audio(),bus=ctx&&bgmBus(ctx)
    if(!ctx||!bus)return
    current?.fadeOut(.35)
    current=new Player(SONGS[name],ctx,bus,ctx.currentTime+.08)
    currentName=name
  },
  stop(){
    localAudio?.pause()
    current?.fadeOut(.3)
    current=null;currentName=''
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
