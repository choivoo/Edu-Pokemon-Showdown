/**
 * Cross-device stream of the user-supplied, user-authorized 75-minute soundtrack.
 * The single MP3 is a GitHub Release asset, not bundled in the JavaScript/CSS.
 *
 * Unlike a WebAudio MediaElementSource, direct HTMLAudioElement playback also
 * works if GitHub's release redirect does not provide CORS permission.
 * No background auto-download: the browser streams metadata/ranges as needed.
 */
import { CUE_DETAILS, type OfficialCue } from './officialCues'

/** Existing public GitHub release. Upload the authorized MP3 once under this exact asset filename. */
export const LICENSED_ASSET_URL =
  'https://github.com/choivoo/Pokemon-Quest-fan.Edition/releases/download/v1.0.0-official/quest-licensed-soundtrack.mp3'
export const SOUNDTRACK_DURATION = 4524.225

export function soundtrackSecond(timestamp: string): number {
  const chunks=timestamp.split(':').map(Number)
  if(chunks.length<2||chunks.length>3||chunks.some(x=>!Number.isFinite(x)||x<0))throw Error('Invalid soundtrack timestamp')
  return chunks.reduce((n,x)=>n*60+x,0)
}
export function soundtrackRange(cue:OfficialCue): {start:number;end:number} {
  const entry=CUE_DETAILS[cue]
  return {start:soundtrackSecond(entry.start),end:soundtrackSecond(entry.end)}
}

export class LicensedSoundtrack {
  private element: HTMLAudioElement | null = null
  private cue: OfficialCue | null = null
  private bad=false
  private isMuted=false
  private timer: ReturnType<typeof setInterval>|null=null
  private nominalVolume=.48
  private duckEnd=0
  constructor(private onUnavailable:()=>void) {}
  get unavailable(){return this.bad}
  get active(){return !!this.element && !this.bad && this.cue!==null}
  get currentCue(){return this.cue}

  /** Returns false if the asset was not found/was undecodable on this device. */
  play(cue:OfficialCue):boolean {
    if(this.bad)return false
    let audio=this.element
    if(!audio){
      audio=new Audio()
      audio.preload='metadata'
      audio.loop=false
      audio.src=LICENSED_ASSET_URL
      audio.volume=this.nominalVolume
      audio.muted=this.isMuted
      const instance=audio
      audio.addEventListener('error',()=>{
        if(this.element!==instance||this.bad)return
        this.bad=true
        this.stop()
        this.onUnavailable()
      })
      audio.addEventListener('loadedmetadata',()=>{if(this.element===instance)this.seekStart()})
      audio.addEventListener('timeupdate',()=>{if(this.element===instance)this.keepInsideCue()})
      audio.addEventListener('ended',()=>{if(this.element===instance)this.rewind()})
      this.element=audio
    }
    const changed=this.cue!==cue
    this.cue=cue
    if(changed){
      if(audio.readyState>=1)this.seekStart()
      // MediaElement.play() is allowed after the user taps; otherwise unlock()
      // will retry from that user gesture on mobile Safari and Android Chrome.
    }
    if(audio.paused)void audio.play().catch(()=>{})
    if(!this.timer)this.timer=setInterval(()=>this.keepInsideCue(),100)
    return true
  }
  private seekStart(){
    if(!this.element||!this.cue)return
    const {start}=soundtrackRange(this.cue)
    if(this.element.duration>0&&this.element.duration<start+1)return
    try{this.element.currentTime=start}catch{/* metadata may not be seekable yet */}
  }
  private keepInsideCue(){
    if(!this.element||!this.cue||this.element.paused)return
    const {start,end}=soundtrackRange(this.cue)
    const t=this.element.currentTime
    if(t>=end-.04||t<start-.5)this.rewind()
    if(this.duckEnd>0&&Date.now()>this.duckEnd){this.duckEnd=0;this.element.volume=this.nominalVolume}
  }
  private rewind(){
    if(!this.element||!this.cue)return
    const start=soundtrackRange(this.cue).start
    try{this.element.currentTime=start;void this.element.play().catch(()=>{})}catch{/* waiting for metadata */}
  }
  unlock(){
    if(this.element?.paused && this.cue)void this.element.play().catch(()=>{})
  }
  mute(state:boolean){
    this.isMuted=state
    if(this.element)this.element.muted=state
  }
  duck(seconds:number){
    if(!this.element||this.bad)return
    this.element.volume=.15
    this.duckEnd=Date.now()+seconds*1000
  }
  pause(){
    if(this.element)this.element.pause()
    this.cue=null
    if(this.timer){clearInterval(this.timer);this.timer=null}
  }
  stop(){this.pause()}
}
