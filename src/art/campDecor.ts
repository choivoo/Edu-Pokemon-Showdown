/**
 * Original hand-drawn, flat-Canvas camp furniture. No ripped game graphics:
 * purchased decorations are placed as physical 2D objects in the island scene.
 */
import { DECORATIONS } from '../lib/decorations'

export interface CampPlacement {id:string;x:number;y:number}
const POSITIONS:readonly [number,number][]=[
 [96,194],[218,186],[341,210],[455,186],[818,176],[896,226],
 [99,285],[212,286],[346,270],[465,292],[824,286],[916,309],
 [116,371],[228,375],[341,370],[469,373],[812,383],[896,379],
]
const catalog=new Set<string>(DECORATIONS.map(x=>x.id))
export function campPlacements(owned:readonly string[]):CampPlacement[]{
 return [...new Set(owned)].filter(id=>catalog.has(id)).slice(0,POSITIONS.length)
  .map((id,i)=>({id,x:POSITIONS[i][0],y:POSITIONS[i][1]}))
}
const palette=(id:string)=>{
 if(id.includes('flareon')||id.includes('charizard')||id.includes('charmander'))return ['#ffe79d','#ed7a38','#92382b'] as const
 if(id.includes('vaporeon')||id.includes('blastoise')||id.includes('squirtle'))return ['#c9f6ff','#4daef1','#34618b'] as const
 if(id.includes('jolteon')||id.includes('pikachu')||id.includes('venusaur'))return ['#fff1a2','#f5bd36','#83632b'] as const
 return ['#ecddf4','#b9a4cd','#735784'] as const
}
function square(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,color:string){
 ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h)
}
function diamond(ctx:CanvasRenderingContext2D,y:number,w:number,h:number,fill:string,stroke:string){
 ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=2
 ctx.beginPath();ctx.moveTo(0,y-h);ctx.lineTo(w,y);ctx.lineTo(0,y+h);ctx.lineTo(-w,y);ctx.closePath()
 ctx.fill();ctx.stroke()
}
function drawOne(ctx:CanvasRenderingContext2D,id:string,t:number){
 const [light,base,dark]=palette(id)
 const dark2='#584a39'
 ctx.save()
 ctx.fillStyle='#27382135';ctx.beginPath();ctx.ellipse(0,2,33,11,0,0,Math.PI*2);ctx.fill()
 // Stone base below every object, visually anchored to grassy terrain.
 diamond(ctx,-6,31,12,'#ddcda3','#9b845e')
 square(ctx,-27,-4,54,7,'#ad9670')
 if(id.endsWith('Flag')){
   square(ctx,-2,-77,5,69,dark2)
   ctx.fillStyle=base;ctx.beginPath()
   ctx.moveTo(4,-77);ctx.lineTo(43,-68+Math.sin(t*3)*2);ctx.lineTo(40,-38);ctx.lineTo(4,-47);ctx.closePath();ctx.fill()
   square(ctx,10,-67,17,5,light);square(ctx,10,-56,11,6,dark)
 }else if(id.includes('Cushion')){
   square(ctx,-29,-29,58,24,dark);square(ctx,-32,-38,64,18,base)
   square(ctx,-24,-36,48,7,light);square(ctx,-26,-16,52,7,dark2)
   square(ctx,-8,-33,16,12,'#fff2ba')
 }else if(id.includes('Fountain')){
   square(ctx,-33,-23,66,15,dark);square(ctx,-28,-24,56,8,light)
   square(ctx,-24,-22,48,6,base)
   square(ctx,-11,-68,22,40,dark);square(ctx,-14,-70,28,8,light)
   square(ctx,-3,-84+Math.sin(t*5)*2,6,14,'#83eaff')
   square(ctx,-21,-57,7,29,'#8bdbfd');square(ctx,14,-57,7,29,'#8bdbfd')
 }else if(id.includes('Torch')){
   square(ctx,-24,-14,48,10,dark2);square(ctx,-16,-46,32,36,base)
   square(ctx,-13,-48,26,7,light)
   for(let i=0;i<4;i++)square(ctx,-17+i*11,-59-Math.sin(t*9+i)*4,7,17,i%2?'#fff59c':'#ff963c')
 }else if(id.includes('Planter')){
   square(ctx,-26,-39,52,30,dark);square(ctx,-28,-45,56,9,base)
   for(let i=0;i<5;i++){
     ctx.fillStyle=i%2?'#54ac4e':'#87cf5c'
     ctx.beginPath();ctx.ellipse(-19+i*9,-61-(i%2)*13,11,19,(i-2)*.25,0,Math.PI*2);ctx.fill()
   }
 }else if(id.includes('Tent')){
   ctx.fillStyle=base;ctx.strokeStyle=dark2;ctx.lineWidth=3
   ctx.beginPath();ctx.moveTo(-32,-12);ctx.lineTo(0,-84);ctx.lineTo(33,-12);ctx.closePath();ctx.fill();ctx.stroke()
   ctx.fillStyle=dark;ctx.beginPath();ctx.moveTo(-11,-13);ctx.lineTo(0,-52);ctx.lineTo(12,-13);ctx.closePath();ctx.fill()
   square(ctx,-8,-25,16,16,'#413a35')
 }else if(id.includes('Balloon')){
   square(ctx,-2,-37,3,31,dark2)
   const shift=Math.sin(t*2)*6
   ctx.fillStyle=base;ctx.strokeStyle=dark;ctx.lineWidth=3
   ctx.beginPath();ctx.ellipse(shift,-71+Math.sin(t*3)*3,25,27,0,0,Math.PI*2);ctx.fill();ctx.stroke()
   square(ctx,shift-9,-81,8,7,light);square(ctx,shift+6,-81,8,7,light)
 }else if(id.includes('Chair')){
   square(ctx,-29,-46,58,42,dark);square(ctx,-23,-61,46,25,base)
   square(ctx,-24,-21,48,10,light);square(ctx,-30,-15,6,15,dark2);square(ctx,24,-15,6,15,dark2)
 }else if(id.includes('Surfboard')){
   ctx.save();ctx.rotate(-.33)
   square(ctx,-21,-81,42,77,base);square(ctx,-15,-73,30,60,light)
   square(ctx,-4,-64,8,44,dark)
   ctx.restore()
 }else if(id.includes('Arch')){
   square(ctx,-34,-61,15,54,dark);square(ctx,19,-61,15,54,dark)
   square(ctx,-34,-68,68,17,base)
   square(ctx,-17,-69,34,8,light)
   square(ctx,-10,-54,20,16,'#f6d26c')
 }else if(id.includes('Vane')){
   square(ctx,-3,-70,6,63,dark2)
   square(ctx,-28,-68,56,7,base)
   square(ctx,-4,-88,8,31,base)
   ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(0,-95);ctx.lineTo(19,-72);ctx.lineTo(-19,-72);ctx.closePath();ctx.fill()
 }else if(id.includes('Bag')){
   square(ctx,-20,-66,40,57,dark);square(ctx,-16,-63,32,52,base)
   for(let i=0;i<3;i++)square(ctx,-10+i*10,-88+i*4,5,30,light)
   square(ctx,-15,-17,30,5,light)
 }else{
   // Cube-shaped classic pocket-monster style toy, distinct from source art.
   square(ctx,-27,-56,54,47,dark);square(ctx,-23,-59,46,43,base)
   square(ctx,-17,-53,15,13,light);square(ctx,4,-53,15,13,light)
   square(ctx,-8,-30,16,6,dark2)
 }
 ctx.restore()
}
/** Draw underneath walking Pokémon so the camp uses 2D scene depth. */
export function drawCampDecorations(ctx:CanvasRenderingContext2D,owned:readonly string[],t:number):void{
 for(const place of campPlacements(owned)){
   ctx.save();ctx.translate(place.x,place.y)
   drawOne(ctx,place.id,t)
   ctx.restore()
 }
}
