// 음악과 별개로 설계한 대역별 효과음 합성 엔진.
// 16bit 레트로의 짧은 어택과 게임기 특유의 유쾌한 음높이 변화를 유지하면서
// 필터 노이즈, 미세한 음정 흔들림, 배음, 피치 엔벨로프로 소리의 깊이를 만든다.
import { audio, isMuted, masterOut, setMuted } from './audio'
import { bgm, jingle } from './music'
export { bgm, isMuted, setMuted }
type Wave = 'sine'|'triangle'|'square'|'sawtooth'
interface Tone { f: number; end?:number; at?:number; dur:number; vol?:number; wave?:Wave; attack?:number; cutoff?:number; resonance?:number }
function tone({f,end,at=0,dur,vol=0.08,wave='triangle',attack=0.004,cutoff=0,resonance=0}:Tone) {
  const c=audio(),out=masterOut()
  if(!c||!out)return
  const t=c.currentTime+at
  const osc=c.createOscillator()
  const gain=c.createGain()
  osc.type=wave;osc.frequency.setValueAtTime(Math.max(25,f),t)
  if(end)osc.frequency.exponentialRampToValueAtTime(Math.max(25,end),t+dur)
  gain.gain.setValueAtTime(0.0001,t)
  gain.gain.linearRampToValueAtTime(Math.max(0.0001,vol),t+Math.min(attack,dur*.3))
  gain.gain.exponentialRampToValueAtTime(0.0001,t+dur)
  if(cutoff>0){
    const filt=c.createBiquadFilter();filt.type='lowpass';filt.frequency.value=cutoff;filt.Q.value=resonance
    osc.connect(filt).connect(gain).connect(out)
  }else osc.connect(gain).connect(out)
  osc.start(t);osc.stop(t+dur+.012)
}
/** 재사용되는 무작위 잡음을 1초 버퍼로 캐시해 순간 충격음을 만든다. */
const cache=new WeakMap<BaseAudioContext,AudioBuffer>()
function noise(at:number,dur:number,vol:number,center=1200,quality=0.8) {
  const c=audio(),out=masterOut()
  if(!c||!out)return
  let buf=cache.get(c)
  if(!buf){
    buf=c.createBuffer(1,c.sampleRate,c.sampleRate)
    const data=buf.getChannelData(0)
    let seed=1234567
    for(let i=0;i<data.length;i++){seed=(Math.imul(1664525,seed)+1013904223)>>>0;data[i]=seed/2147483648-1}
    cache.set(c,buf)
  }
  const t=c.currentTime+at
  const n=c.createBufferSource();n.buffer=buf
  const filter=c.createBiquadFilter();filter.type='bandpass';filter.frequency.value=center;filter.Q.value=quality
  const gain=c.createGain()
  gain.gain.setValueAtTime(Math.max(0.0001,vol),t)
  gain.gain.exponentialRampToValueAtTime(0.0001,t+dur)
  n.connect(filter).connect(gain).connect(out)
  n.start(t);n.stop(t+dur+.01)
}
function sparkle(base=850){
  tone({f:base,end:base*1.48,dur:.11,vol:.055,wave:'sine'})
  tone({f:base*1.5,end:base*2.02,at:.045,dur:.16,vol:.034,wave:'triangle'})
  tone({f:base*2.02,end:base*2.35,at:.095,dur:.22,vol:.025,wave:'sine'})
}
function impact(strength=1){
  noise(0,.12*strength,.17*strength,850,0.65)
  noise(.025,.09*strength,.08*strength,2800,1.5)
  tone({f:190*strength,end:55,dur:.21*strength,vol:.16*strength,wave:'triangle'})
  tone({f:90*strength,end:50,at:.012,dur:.28*strength,vol:.10*strength,wave:'sine'})
}
export const sfx={
  select:()=>{tone({f:740,end:1050,dur:.065,vol:.045,wave:'sine'});tone({f:1250,at:.03,dur:.07,vol:.026,wave:'triangle'})},
  correct:()=>{sparkle(660);tone({f:1320,at:.15,dur:.25,vol:.04,wave:'sine'})},
  wrong:()=>{tone({f:310,end:170,dur:.22,vol:.06,wave:'triangle'});tone({f:415,end:150,at:.075,dur:.25,vol:.04,wave:'sawtooth',cutoff:600})},
  hit:()=>impact(.65),
  superHit:()=>{impact(1);sparkle(720)},
  crit:()=>{impact(1.2);noise(.07,.15,.13,5000,2);sparkle(1040)},
  faint:()=>{tone({f:480,end:95,dur:.55,vol:.09,wave:'triangle'});noise(.12,.31,.07,360,.9)},
  tick:()=>{tone({f:1360,end:1100,dur:.032,vol:.025,wave:'sine'})},
  coin:()=>{tone({f:1046,at:0,dur:.12,vol:.06,wave:'sine'});tone({f:1568,at:.09,dur:.29,vol:.052,wave:'triangle'});tone({f:3136,at:.1,dur:.17,vol:.018,wave:'sine'})},
  special:()=>{noise(0,.2,.075,1800,.6);tone({f:280,end:880,dur:.24,vol:.1,wave:'sawtooth',cutoff:2500});tone({f:440,end:1760,at:.09,dur:.25,vol:.075,wave:'sine'});sparkle(940)},
  step:()=>{tone({f:125,end:83,dur:.045,vol:.032,wave:'triangle'});noise(0,.025,.02,340,1)},
  win:()=>jingle('win'),lose:()=>jingle('lose'),levelup:()=>jingle('levelup'),cook:()=>jingle('cook'),
}
