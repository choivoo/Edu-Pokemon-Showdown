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
export const LOCAL_CUES: Record<SongName,{start:number;end:number}>={
 title:{start:0,end:158}, camp:{start:438,end:580}, map:{start:1047,end:1260},
 battle:{start:684,end:798}, boss:{start:798,end:914}, story:{start:914,end:943},
 tide:{start:1260,end:1483}, grove:{start:580,end:684}, echo:{start:3743,end:4059},
 spark:{start:1483,end:1674}, ember:{start:1674,end:1800}, astral:{start:3288,end:3494},
}
let localAudio:HTMLAudioElement|null=null
let localBlobUrl:string|null=null
let activeLocalCue:{start:number;end:number}|null=null
let activeCue:TrackCue|null=null
let remoteChecked=false
let remoteReady=false
/** Shared, optionally deployed licensed asset. No per-device file picker required. */
const sharedMusicUrl = import.meta.env.BASE_URL + 'audio/quest-complete.mp3'
function cueOf(name:SongName):TrackCue {
 return ({title:'title',camp:'camp',map:'expeditions',story:'storyTalk',battle:'firstSteppe',boss:'boss1',tide:'brook',grove:'gloom',echo:'cave',spark:'peak',ember:'plain',astral:'happenGrass'} as Record<SongName,TrackCue>)[name]
}
function setCue(player:HTMLAudioElement,cue:TrackCue){
 const range=SOUNDTRACK_CUES[cue]
 activeCue=cue
 activeLocalCue={start:range[0],end:range[1]}
 const seek=()=>{if(activeCue===cue)player.currentTime=range[0]}
 if(player.readyState>=1)seek()
 else player.addEventListener('loadedmetadata',seek,{once:true})
 void player.play().catch(()=>{/* gesture restrictions: next tap resumes */})
}
function attachSharedMusic(ctx:AudioContext,dest:AudioNode):boolean{
 if(localAudio || !remoteReady)return false
 const player=new Audio(sharedMusicUrl)
 player.preload='auto'
 player.crossOrigin='anonymous'
 const node=ctx.createMediaElementSource(player)
 node.connect(dest)
 player.addEventListener('timeupdate',()=>{
  if(!activeLocalCue)return
  const t=player.currentTime
  if(t>=activeLocalCue.end-.12||t<activeLocalCue.start-.5)player.currentTime=activeLocalCue.start
 })
 player.addEventListener('error',()=>{if(localAudio===player){localAudio=null;currentName='';activeLocalCue=null;bgm.play('camp')}})
 localAudio=player
 return true
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
    localAudio=null;activeLocalCue=null;activeCue=null
    if(localBlobUrl)URL.revokeObjectURL(localBlobUrl)
    localBlobUrl=null;currentName=''
    this.play(previous)
  },
  /** Play the licensed shared soundtrack chapter corresponding to a game scene. */
  playCue(cue:TrackCue, fallback:SongName='battle'){
    activeCue=cue
    if(localAudio){currentName='';this.play(fallback);return}
    this.play(fallback)
  },
  /** Browser-only one-time check; works across devices after asset is hosted on Pages. */
  enableSharedMusic(){
    if(remoteChecked)return
    remoteChecked=true
    void fetch(sharedMusicUrl,{method:'HEAD'}).then(async res=>{
      if(!res.ok)return
      remoteReady=true
      const ctx=audio(),out=ctx&&bgmBus(ctx)
      if(!ctx||!out||localAudio)return
      if(attachSharedMusic(ctx,out)){
        const name=currentName||'title'
        current?.fadeOut(.2);current=null;currentName=''
        this.play(name)
      }
    }).catch(()=>{/* synth audio is safe fallback */})
  },
  /** 배경음악을 바꾼다. 이미 같은 곡이면 그대로 둔다. */
  play(name: SongName) {
    if (currentName === name && (current || localAudio))return
    if(!remoteChecked)this.enableSharedMusic()
    if(remoteReady && !localAudio){const ctx=audio(),out=ctx&&bgmBus(ctx);if(ctx&&out)attachSharedMusic(ctx,out)}
    if(localAudio){
      const cue=activeCue ?? cueOf(name)
      const range=SOUNDTRACK_CUES[cue]
      activeLocalCue={start:range[0],end:range[1]}
      current?.fadeOut(0.15);current=null
      const player=localAudio
      const seek=()=>{
        if(localAudio===player && activeCue===cue)
          player.currentTime=Math.min(range[0],Math.max(0,(player.duration||4524)-1))
      }
      if(player.readyState>=1)seek()
      else player.addEventListener('loadedmetadata',seek,{once:true})
      void player.play().catch(()=>{/* browsers may require a new user gesture */})
      currentName=name
      return
    }
    const ctx = audio()
    const bus = ctx && bgmBus(ctx)
    if (!ctx || !bus) return
    current?.fadeOut(0.35)
    current = new Player(SONGS[name], ctx, bus, ctx.currentTime + 0.08)
    currentName = name
  },
  stop() {
    localAudio?.pause()
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
