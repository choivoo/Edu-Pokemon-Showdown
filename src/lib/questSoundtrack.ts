/** Original 2D island-adventure soundtrack v3. No Pokémon Quest melody or game audio is sampled. */
import type { Song, NoteEv, DrumEv, Track } from './songs'
import type { NoteInstName, DrumInstName } from './instruments'
const keys = {
  title: { bpm:132, root:0, scale:[0,2,4,5,7,9,11], chords:['C','G','Am','F','C','G','F','G','C','Em','Am','F','Dm','G','C','G'], lead:'marimba', energy:3 },
  camp: { bpm:94, root:7, scale:[7,9,11,0,2,4,6], chords:['G','Em','C','D','G','Bm','C','D','Em','Bm','C','G','Am','D','G','D'],lead:'marimba',energy:1 },
  map: { bpm:116, root:2, scale:[2,4,6,7,9,11,1], chords:['D','A','Bm','G','D','A','G','A','D','F#m','Bm','G','Em','A','D','A'],lead:'flute',energy:2 },
  battle: { bpm:154, root:4, scale:[4,6,7,9,11,0,2,3], chords:['Em','C','G','D','Em','C','D','B','Am','Em','C','D','Am','Em','B','B'],lead:'lead',energy:4 },
  boss: { bpm:167, root:2, scale:[2,4,5,7,9,10,0,1], chords:['Dm','Dm','Bb','A','Dm','Dm','Gm','A','Dm','F','Bb','A','Gm','A','Dm','A'],lead:'brass',energy:5 },
  story: { bpm:80, root:9, scale:[9,11,0,2,4,5,7,8], chords:['Am','F','C','G','Am','F','G','E'],lead:'flute',energy:1 },
  tide: { bpm:122,root:2,scale:[2,4,6,7,9,11,1],chords:['D','A','Bm','G','D','G','A','D'],lead:'marimba',energy:2 },
  grove: { bpm:106,root:7,scale:[7,9,11,0,2,4,6],chords:['G','Em','C','D','G','C','Am','D'],lead:'flute',energy:2 },
  echo: { bpm:91,root:9,scale:[9,11,0,2,4,5,8],chords:['Am','F','Dm','E','Am','C','F','E'],lead:'bell',energy:1 },
  spark: { bpm:146,root:4,scale:[4,6,7,9,11,0,2,3],chords:['Em','C','G','D','Em','Am','B','Em'],lead:'lead',energy:4 },
  ember: { bpm:158,root:2,scale:[2,4,5,7,9,10,1],chords:['Dm','Bb','Gm','A','Dm','Bb','A','Dm'],lead:'brass',energy:5 },
  astral: { bpm:112,root:0,scale:[0,2,4,5,7,9,11],chords:['C','Am','F','G','C','Em','Dm','G'],lead:'bell',energy:2 },
} as const
const NOTES: Record<string,number> = {C:0,D:2,E:4,F:5,G:7,A:9,B:11}
function chordTones(chord:string,base=60):number[] {
  const m=/^([A-G])([#b]?)(m7|m|7|maj7)?$/.exec(chord)
  if(!m) throw Error('Unknown chord '+chord)
  const root=NOTES[m[1]]+(m[2]==='#'?1:m[2]==='b'?-1:0)
  const start=base + ((root-base)%12+12)%12
  const iv=m[3]==='m'||m[3]==='m7'?[0,3,7]:[0,4,7]
  return iv.map(v=>start+v)
}
const rng=(seed:number)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
type Config = {bpm:number;root:number;scale:readonly number[];chords:readonly string[];lead:string;energy:number}
function create(name:string,c:Config, index:number):Song {
  const rand=rng(6613+index*7137)
  const bars=c.chords.length,events:NoteEv[]=[],bass:NoteEv[]=[],bell:NoteEv[]=[],pad:NoteEv[]=[]
  const motifs=[[0,2,4,1,3,2,1,0],[0,4,3,2,1,2,0,5],[0,1,3,4,2,3,5,0],[0,2,1,4,3,5,2,0]]
  const melodyPositions=c.energy>=4?[0,2,4,6,8,10,12,14]:c.energy<=1?[0,4,6,10,12,14]:[0,2,5,8,10,13]
  for(let bar=0;bar<bars;bar++){
    const chord=chordTones(c.chords[bar],60)
    const low=chordTones(c.chords[bar],36)[0]
    const isBuild=bar>=bars-4
    const motif=motifs[(index+Math.floor(bar/4))%motifs.length]
    for(let k=0;k<melodyPositions.length;k++){
      const step=melodyPositions[k], degree=motif[(k+bar%4)%motif.length]
      let midi:number
      if(step===0) midi=chord[(bar+index)%3]+12
      else {
        const choices=c.scale.map(pc=>72+((pc-72)%12+12)%12).sort((a,b)=>a-b)
        midi=choices[(degree+index+bar%2)%choices.length]
        if(isBuild&&k%3===0)midi+=12
        if(midi>92)midi-=12
      }
      const next=melodyPositions[k+1]??16
      events.push({step:bar*16+step,midi,dur:Math.min(next-step,c.energy>=4?3:5),vel:step===0?0.97:(0.63+rand()*0.23)})
    }
    for(let k=0;k<(c.energy>=4?8:4);k++){
      const pos=k*(c.energy>=4?2:4)
      bass.push({step:bar*16+pos,midi:k%4===3?low+7:low,dur:c.energy>=4?2:4,vel:k%2===0?0.75:0.48})
    }
    for(let k=0;k<3;k++)pad.push({step:bar*16,midi:chord[k]-12,dur:15,vel:0.58})
    for(let pos=0;pos<16;pos+=4){
      const n=chord[(pos/4+bar)%3]+12
      bell.push({step:bar*16+pos,midi:n,dur:2,vel:pos===0?0.3:0.15})
    }
  }
  const t=(inst:NoteInstName,vol:number,e:NoteEv[]):Track=>({kind:'note',inst,vol,events:e})
  const d=(inst:DrumInstName,vol:number,pattern:string):Track=>({kind:'drum',inst,vol,events:Array.from({length:bars*16},(_,step)=>({step,vel:pattern[step%16]==='x'?1:pattern[step%16]==='o'?.48:0})).filter(e=>e.vel>0)})
  const tracks:Track[]=[t(c.lead as NoteInstName,0.96,events),t('pluck',0.56,bass),t('pad',0.34,pad),t('bell',0.3,bell)]
  if(c.energy>=3){tracks.push(d('kick',0.72,'x...x...x...x...'),d('snare',0.58,'....x.......x...'),d('hat',0.3,'xoxoxoxoxoxoxoxo'))}
  else {tracks.push(d('kick',0.4,'x.......x.......'),d('rim',0.28,'....o.......o...'),d('shaker',0.2,'x...o...x...o...'))}
  return {name,bpm:c.bpm,bars,swing:c.energy<=2?0.11:0,loop:true,tracks}
}
export const QUEST_RECOMPOSED_SONGS = Object.fromEntries(Object.entries(keys).map(([n,c],i)=>[n,create(n,c,i)])) as {[K in keyof typeof keys]: Song}
function fanfare(name:string,numbers:number[],bpm:number):Song{
  const events:NoteEv[]=numbers.map((m,i)=>({step:i*2,midi:m,dur: i===numbers.length-1?4:2,vel:1}))
  const chord=chordTones('C',48)
  return {name,bpm,bars:2,swing:0,loop:false,tracks:[
    {kind:'note',inst:'marimba',vol:0.9,events},
    {kind:'note',inst:'bell',vol:0.43,events:events.map(e=>({...e,midi:e.midi+12,vel:0.56}))},
    {kind:'note',inst:'pad',vol:0.28,events:chord.map(midi=>({step:0,midi,dur:30,vel:0.65}))},
  ]}
}
export const QUEST_RECOMPOSED_JINGLES={
  win:fanfare('win',[67,72,76,79,84,79,84,88],144),
  lose:fanfare('lose',[72,69,65,64,60,57],88),
  levelup:fanfare('levelup',[64,67,72,76,79,84,88],180),
  cook:fanfare('cook',[60,64,67,72,76,79,84],166),
} as const
