/**
 * Optional personal soundtrack playback from a file the player explicitly
 * selects in their OWN browser. We do not bundle or publish any original
 * Pokémon audio. Each device keeps its own private IndexedDB copy when
 * storage quotas permit; the public build ships original procedural songs.
 */
import { audio, masterOut } from './audio'
import type { SongName } from './songs'
export interface TrackMarker { title:string; start:number; end:number }
const S=(clock:string)=>{const chunks=clock.split(':').map(Number);return chunks.reduce((total,n)=>total*60+n,0)}
const ORDER:[string,string][]=[
['00:00','Title'],['02:38','Intro'],['04:44','Tutorial'],['06:30','Expedition Results'],
['07:18','Base Camp'],['09:40','Expeditions'],['11:24','First Steppe'],['13:18','Boss Battle 1'],
['15:14','Story Talk'],['15:43','Boss Battle 2'],['17:27','Gloomy Grove'],
['21:00','Backforth Brook'],['24:43','Parched Peak'],['27:54','Belly Button Cave'],
['30:28','Pincushion Plain'],['33:42','Miasma Moor'],['36:39','Hushed Highlands'],
['40:12','Nightlight Nook'],['44:16','Farside Fjord'],['48:18','Story Emergency'],
['49:03','Mewtwo Battle'],['52:13','Staff Roll'],['54:48','Happenstance Island — Grassland'],
['58:14','Happenstance Island — Waterside'],['1:02:23','Happenstance Island — Cave'],
['1:07:39','Happenstance Island — Forest'],['1:10:47','Happenstance Island — Mountain'],
]
export const TRACKLIST:TrackMarker[]=ORDER.map(([time,title],i)=>({
 title,start:S(time),end:i===ORDER.length-1?4524.225:S(ORDER[i+1][0])
}))
const SCENE:Record<SongName,number>={title:0,camp:4,map:5,battle:6,boss:7,story:8,
  tide:11,grove:10,echo:13,spark:14,ember:12,astral:22}
let url:string|null=null
let player:HTMLAudioElement|null=null
let node:MediaElementAudioSourceNode|null=null
let activeName:SongName|null=null
let activeEnd=0
let activeStart=0
const DB='pokemon-quest-local-soundtrack'
const STORE='private-files'
async function withDB():Promise<IDBDatabase>{
 return await new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1)
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)}
  request.onsuccess=()=>resolve(request.result)
  request.onerror=()=>reject(request.error)
 })
}
async function dbPut(file:File|null):Promise<void>{
 const db=await withDB()
 try{await new Promise<void>((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite')
  tx.objectStore(STORE).put(file??null,'audio')
  tx.oncomplete=()=>resolve()
  tx.onerror=()=>reject(tx.error)
  tx.onabort=()=>reject(tx.error)
 })}finally{db.close()}
}
async function dbGet():Promise<Blob|null>{
 const db=await withDB()
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly')
  const req=tx.objectStore(STORE).get('audio')
  req.onsuccess=()=>resolve(req.result instanceof Blob ?req.result:null)
  req.onerror=()=>reject(req.error)
 })}finally{db.close()}
}
function initAudio(){
 if(!player){
  player=new Audio()
  player.preload='metadata'
  player.loop=false
  player.addEventListener('timeupdate',()=>{if(player && player.currentTime>=activeEnd-.06)player.currentTime=activeStart})
  player.addEventListener('ended',()=>{if(player){player.currentTime=activeStart;void player.play().catch(()=>{})}})
 }
 if(!node){
  const ctx=audio(),out=masterOut()
  if(ctx&&out){node=ctx.createMediaElementSource(player);node.connect(out)}
 }
}
function loadBlob(file:Blob){
 if(url)URL.revokeObjectURL(url)
 url=URL.createObjectURL(file)
 initAudio()
 if(player)player.src=url
}
export async function installLocalSoundtrack(file:File):Promise<{persistent:boolean;message:string}>{
 if(!/audio\/|\.mp3$|\.m4a$|\.ogg$|\.wav$/i.test(file.type+' '+file.name))throw Error('오디오 파일을 선택해 주세요.')
 loadBlob(file)
 try{await dbPut(file);return {persistent:true,message:'이 기기에 보관했어요. 게임 음악이 자동으로 바뀝니다.'}}
 catch{return {persistent:false,message:'이 기기의 저장 용량이 부족해요. 현재 탭에서는 재생되지만 재접속하면 다시 파일을 선택해야 합니다.'}}
}
export async function restoreLocalSoundtrack():Promise<boolean>{
 try{const saved=await dbGet();if(saved){loadBlob(saved);return true}}catch{/* unsupported storage; built-in soundtrack remains */}
 return false
}
export async function clearLocalSoundtrack(){
 stopLocalSoundtrack()
 if(url)URL.revokeObjectURL(url)
 url=null
 if(player){player.removeAttribute('src');player.load()}
 try{await dbPut(null)}catch{/* ephemeral setting already cleared */}
}
function startSegment(start:number,end:number,name:SongName|null){
 if(!url)return false
 initAudio()
 if(!player)return false
 activeName=name;activeStart=start;activeEnd=end
 player.currentTime=start
 void player.play().catch(()=>{/* requires direct user interaction */})
 return true
}
export const localSoundtrackReady=()=>url!==null
export const localSoundtrackPlaying=(name:SongName)=>!!url&&activeName===name&&!!player&&!player.paused
export function playLocalSoundtrack(name:SongName):boolean{
 if(!url)return false
 const marker=TRACKLIST[SCENE[name]]
 return startSegment(marker.start,marker.end,name)
}
export function previewLocalTrack(index:number):boolean{
 const marker=TRACKLIST[index]
 return !!marker&&startSegment(marker.start,marker.end,null)
}
export function stopLocalSoundtrack(){if(player)player.pause();activeName=null}
