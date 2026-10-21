/**
 * Procedural Pokéxel-inspired pixel art.
 * Pixel geometry is authored here, not ripped from the original 3D game.
 * Each species gets deterministic shape/marking details; key starters and bosses
 * have extra signature anatomy. Works without any third-party image CDN.
 */
import { getSpecies } from '../lib/roster'
import type { PokemonType } from '../types'

const TYPE_COLORS: Record<PokemonType, string> = {
  normal:'#c7a17d', fire:'#ee8b43', water:'#77bfe9', electric:'#f8dc45',
  grass:'#83bd63', ice:'#a4d9e9', fighting:'#a87b62', poison:'#b586c1',
  ground:'#c49a64', flying:'#b2c8df', psychic:'#d49cc9', bug:'#aac35a',
  rock:'#9b8c72', ghost:'#8b80ae', dragon:'#8aa6bf', dark:'#6a6a87',
  steel:'#aab9c7', fairy:'#edaece',
}
const PALETTE: Record<number,string> = {
  1:'#7db79a',2:'#6ba88e',3:'#64a78a',4:'#f29c62',5:'#e8895c',6:'#ef8c4b',
  7:'#8ec5ea',8:'#71b3de',9:'#6dadd8',10:'#b8d98a',13:'#b6c16e',
  16:'#caaf8d',19:'#b8aaa7',20:'#b79e8c',25:'#ffe04d',26:'#eebf4a',
  35:'#f6bfd0',39:'#f7b6c9',52:'#e6c7a7',63:'#dfc17e',74:'#b2a290',
  92:'#a692ba',93:'#8c78a2',94:'#796795',95:'#8b918e',103:'#8cba67',
  104:'#c7bda3',113:'#f6cfc9',125:'#e7b454',130:'#6ab6cc',131:'#6eabd1',
  133:'#be957b',134:'#72a6c3',135:'#f5c864',136:'#e39b66',143:'#55878c',
  147:'#a7bce4',148:'#99afdd',149:'#d9a571',150:'#b7a3d8',151:'#ebc5ed',
}
const cache = new Map<string,string>()
const birds = new Set([16,17,18,21,22,83,84,85,142,144,145,146,149])
const waterFins = new Set([54,55,60,61,62,72,73,79,80,86,87,90,91,98,99,116,117,118,119,129,130,131,134])
const horned = new Set([29,30,31,32,33,34,78,95,111,112,127,128])
const grassy = new Set([1,2,3,43,44,45,46,47,69,70,71,102,103,114])
const fireTails = new Set([4,5,6,37,38,58,59,77,78,126,136])
const longEars = new Set([25,26,35,36,39,40,81,82,133,135,150])
const ghosts = new Set([92,93,94])

function mix(hex:string, target:string, amount:number):string {
  const a=hex.slice(1).match(/../g)!.map(v=>parseInt(v,16))
  const b=target.slice(1).match(/../g)!.map(v=>parseInt(v,16))
  return '#'+a.map((v,i)=>Math.round(v*(1-amount)+b[i]*amount).toString(16).padStart(2,'0')).join('')
}
function rect(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,c:string) {
  g.fillStyle=c;g.fillRect(x,y,w,h)
}
function poly(g:CanvasRenderingContext2D,pts:number[][],c:string) {
  g.fillStyle=c;g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill()
}
function cube(g:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string,depth=7) {
  const dark=mix(color,'#17172c',0.47), light=mix(color,'#ffffff',0.22)
  rect(g,x-3,y+depth,w+6,h+2,dark)
  poly(g,[[x-3,y+depth],[x+depth,y],[x+w+depth,y],[x+w-3,y+depth]],light)
  poly(g,[[x+w-3,y+depth],[x+w+depth,y],[x+w+depth,y+h],[x+w-3,y+h+depth]],mix(color,'#17172c',0.24))
  rect(g,x,y+depth,w,h,color)
  rect(g,x+2,y+depth+2,5,h-4,light)
  rect(g,x,y+depth+h-5,w,5,mix(color,'#17172c',0.17))
}
function draw(id:number,back:boolean):string {
  const key=id+':'+Number(back)
  const old=cache.get(key);if(old)return old
  const c=document.createElement('canvas');c.width=96;c.height=96
  const g=c.getContext('2d')!;g.imageSmoothingEnabled=false
  const sp=getSpecies(id),base=PALETTE[id]??TYPE_COLORS[sp.types[0]]
  const dark=mix(base,'#161d29',0.55),light=mix(base,'#ffffff',0.25)
  const seed=(n:number)=>((id*17011+n*3581)%97)/97
  const bodyW=34+Math.floor(seed(1)*7), headW=(id===143||id===131)?56:46
  const headX=Math.floor((96-headW)/2)
  const eyeY=id===94?49:43

  // Tail / rear projections.
  if(fireTails.has(id)){
    rect(g,69,65,11,6,dark);poly(g,[[76,64],[81,46],[85,59],[89,55],[88,70],[78,74]],'#f56d30')
    poly(g,[[80,63],[83,53],[85,64],[82,67]],'#ffe16b')
  }else if(id===25||id===26){
    poly(g,[[68,58],[83,51],[78,61],[91,65],[75,79],[66,69]],'#f8ca3d')
  }else if(id===130){
    poly(g,[[67,61],[88,51],[80,68],[92,77],[64,76]],'#569fb7')
  }else if(id===150){
    rect(g,67,64,18,7,'#8870ad');poly(g,[[83,64],[90,65],[88,80],[80,81]],'#8870ad')
  }else if(!ghosts.has(id) && seed(3)>0.5){
    poly(g,[[65,68],[81,58],[78,77],[63,75]],dark)
  }
  if(birds.has(id)){
    poly(g,[[25,45],[9,50],[15,74],[34,73]],mix(base,'#282e4d',0.2))
    poly(g,[[66,45],[86,52],[81,73],[62,73]],mix(base,'#282e4d',0.2))
  }
  if(waterFins.has(id)){
    poly(g,[[26,48],[15,40],[17,62],[29,65]],light)
    poly(g,[[66,48],[83,41],[79,68],[63,65]],light)
  }
  // Feet / body: legs are visible block stacks.
  if(!ghosts.has(id)&&id!==130){
    rect(g,31,74,13,12,dark);rect(g,56,74,13,12,dark)
    rect(g,33,77,9,8,light);rect(g,58,77,9,8,light)
  }
  cube(g,Math.floor((96-bodyW)/2),52,bodyW,22,base,5)
  if(grassy.has(id)){
    poly(g,[[32,53],[30,39],[43,43],[52,33],[64,48],[64,55]],'#388f59')
    rect(g,46,33,5,23,'#347549')
  }
  // Signature ears and horns behind the oversized square head.
  if(longEars.has(id)){
    const length=id===25||id===150?24:16
    poly(g,[[27,36],[23,36-length],[31,23-length/2],[39,37]],id===25?'#31364e':dark)
    poly(g,[[57,34],[65,38-length],[73,37],[67,45]],id===25?'#31364e':dark)
  }else if(horned.has(id)){
    poly(g,[[47,37],[49,13],[57,36]],'#e7d7bd')
  }else if(ghosts.has(id)){
    poly(g,[[27,40],[22,24],[41,34]],base);poly(g,[[59,33],[74,22],[67,44]],base)
  }else if(id===133){
    poly(g,[[27,36],[24,20],[42,36]],dark);poly(g,[[60,35],[69,19],[72,39]],dark)
  }else if(id===4||id===5||id===6){
    poly(g,[[30,33],[18,27],[26,43]],light);poly(g,[[64,33],[75,27],[70,44]],light)
  }else if(seed(7)>.5){
    poly(g,[[30,39],[29,29],[40,38]],light)
  }
  // Giant cuboid head with three visible planes.
  cube(g,headX,32,headW,29,base,7)
  if(id===25){
    rect(g,headX+7,56,10,8,'#f38467');rect(g,headX+31,56,9,8,'#f38467')
    rect(g,headX+10,40,7,8,'#202735');rect(g,headX+34,40,7,8,'#202735')
  }
  if(id===1||id===2||id===3){
    rect(g,headX+6,40,6,6,'#ad2936');rect(g,headX+headW-13,40,6,6,'#ad2936')
  }
  if(id===150){
    poly(g,[[23,39],[31,29],[38,36]],'#8d70b3')
    poly(g,[[67,39],[61,29],[55,36]],'#8d70b3')
  }
  if(id===6) {
    poly(g,[[22,35],[13,26],[17,52],[29,58]],'#e1c783')
    poly(g,[[69,35],[84,26],[80,55],[68,60]],'#e1c783')
  }
  if(!back){
    const eye= id===94 ? '#de393d' : '#202630'
    rect(g,headX+11,eyeY,6,7,eye);rect(g,headX+headW-17,eyeY,6,7,eye)
    rect(g,headX+13,eyeY,2,2,'#ffffff')
    rect(g,headX+headW-15,eyeY,2,2,'#ffffff')
    rect(g,44,57,9,2,dark)
    if(id===94){for(let k=0;k<4;k++)rect(g,42+k*3,58,1,4,'#e9e9f1')}
    else if(id===143)rect(g,43,57,10,6,mix(base,'#111827',0.7))
  }else{
    // Back view shows the crown and body; no face or front-facing details.
    rect(g,headX+10,53,headW-20,7,mix(base,'#14192e',0.13))
  }
  if(id===133) {
    rect(g,36,68,27,9,'#f7e3b5')
    rect(g,42,75,15,6,'#f7e3b5')
  }
  if(id===130) {
    rect(g,headX+18,35,6,8,'#f2eee1')
    rect(g,headX+headW-18,35,6,8,'#f2eee1')
  }
  const data=c.toDataURL('image/png')
  cache.set(key,data)
  return data
}
export const cubeFrontSprite=(id:number):string=>draw(id,false)
export const cubeBackSprite=(id:number):string=>draw(id,true)
