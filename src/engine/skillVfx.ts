/**
 * Pixel-island cinematic 2D move effects.
 *
 * Every move passes through this effect renderer.  The spell silhouette comes
 * from each Quest move's actual named move profile; its inner marks come from
 * the move's type.  All paths, light and fragments are drawn by Canvas, never
 * by imported sprites, video or 3D assets.
 */
import type { Move, PokemonType } from '../types'
import { moveProfile, type MoveShape } from '../lib/moveProfiles'
import { TYPE_COLOR } from '../lib/typeChart'

export interface SkillVfx {
  id: string
  type: PokemonType
  shape: MoveShape | 'support'
  fromX: number
  fromY: number
  toX: number
  toY: number
  t0: number
  duration: number
  seed: number
  scale: number
  friendly: boolean
}

const TAU = Math.PI * 2
const point = (angle: number, dist: number) => ({ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist })
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 71.3) * 43758.5453
  return x - Math.floor(x)
}

export function createSkillVfx(move: Move, sx: number, sy: number, tx: number, ty: number, t0: number, friendly = false, scale = 1): SkillVfx {
  const profile = moveProfile(move)
  const power = move.power
  const distance = Math.hypot(tx - sx, ty - sy)
  return {
    id: move.id, type: move.type,
    shape: move.role ? 'support' : profile.shape,
    fromX: sx, fromY: sy, toX: tx, toY: ty, t0,
    duration: move.role ? 0.95 : Math.max(0.52, Math.min(1.22, 0.44 + distance / 850 + profile.windup)),
    seed: move.id.split('').reduce((n, c) => (n * 33 + c.charCodeAt(0)) | 0, 5381),
    scale: scale * (power >= 200 ? 1.2 : power >= 100 ? 1.05 : 0.87),
    friendly,
  }
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number) {
  if (radius <= 0) return
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, 'rgba(255,255,255,' + Math.min(1, alpha * .68) + ')')
  g.addColorStop(.18, color)
  g.addColorStop(.62, color + '89')
  g.addColorStop(1, color + '00')
  ctx.save()
  ctx.globalAlpha = alpha * .48
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(x, y, radius, 0, TAU); ctx.fill()
  ctx.restore()
}

function ring(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, color: string, alpha: number, line = 4, squash = .52) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.lineWidth = line
  ctx.strokeStyle = color
  ctx.beginPath()
  ctx.ellipse(x, y, Math.max(.2, rx), Math.max(.2, rx * squash), 0, 0, TAU)
  ctx.stroke()
  ctx.restore()
}

function streak(ctx: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, color: string, width: number, alpha: number) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, alpha)
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()
  ctx.restore()
}

function bolt(ctx: CanvasRenderingContext2D, sx: number, sy: number, ex: number, ey: number, color: string, alpha: number, steps = 8, width = 5) {
  const dx = ex - sx, dy = ey - sy, d = Math.hypot(dx, dy) || 1
  const normalX = -dy / d, normalY = dx / d
  ctx.save();ctx.globalAlpha = alpha;ctx.strokeStyle = color;ctx.lineWidth = width
  ctx.lineCap = 'square';ctx.lineJoin = 'miter'
  ctx.beginPath();ctx.moveTo(sx,sy)
  for(let i = 1; i < steps; i++) {
    const f = i / steps
    const offset = (rand(i * 13.8 + sx + ey) - .5) * Math.min(36, d / steps * 2)
    ctx.lineTo(sx + dx*f + normalX*offset, sy + dy*f + normalY*offset)
  }
  ctx.lineTo(ex,ey);ctx.stroke();ctx.restore()
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, rot: number, color: string, alpha: number, edges=4) {
  ctx.save()
  ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=alpha;ctx.fillStyle=color
  ctx.beginPath()
  for(let i=0;i<edges*2;i++) {
    const angle = i * Math.PI / edges - Math.PI/2
    const radius = i%2===0 ? size : size*.22
    const dx = Math.cos(angle)*radius,dy=Math.sin(angle)*radius
    if(i===0)ctx.moveTo(dx,dy);else ctx.lineTo(dx,dy)
  }
  ctx.closePath();ctx.fill();ctx.restore()
}

function typeMark(ctx:CanvasRenderingContext2D,x:number,y:number,size:number,type:PokemonType,rot:number,alpha:number) {
  const color=TYPE_COLOR[type]
  const r=size
  ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.globalAlpha=alpha
  ctx.lineWidth=Math.max(2,r*.16);ctx.strokeStyle=color;ctx.fillStyle=color
  switch(type){
    case 'electric': {
      ctx.beginPath()
      ctx.moveTo(-r*.2,-r);ctx.lineTo(r*.42,-r*.28);ctx.lineTo(0,0)
      ctx.lineTo(r*.35,r*.1);ctx.lineTo(-r*.28,r);ctx.lineTo(-r*.08,r*.15)
      ctx.lineTo(-r*.44,0);ctx.closePath();ctx.fill()
      break
    }
    case 'fire': {
      ctx.beginPath()
      ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.88,-r*.3,r*.7,r*.72,0,r)
      ctx.bezierCurveTo(-r*.9,r*.8,-r*.7,-r*.3,0,-r)
      ctx.fill()
      ctx.fillStyle='#fff6b5';ctx.beginPath();ctx.ellipse(0,r*.32,r*.22,r*.38,0,0,TAU);ctx.fill()
      break
    }
    case 'water': {
      ctx.beginPath()
      ctx.moveTo(0,-r);ctx.bezierCurveTo(r*.65,-r*.12,r*.66,r*.28,0,r)
      ctx.bezierCurveTo(-r*.67,r*.38,-r*.57,0,0,-r);ctx.fill();break
    }
    case 'grass':case 'bug': {
      ctx.beginPath();ctx.ellipse(0,0,r*.7,r*.32,-Math.PI/4,0,TAU);ctx.fill()
      ctx.strokeStyle='#e9ffd2';ctx.beginPath();ctx.moveTo(-r*.6,r*.6);ctx.lineTo(r*.6,-r*.6);ctx.stroke();break
    }
    case 'ice': {
      for(let i=0;i<3;i++){const a=i*Math.PI/3;streak(ctx,-Math.cos(a)*r,-Math.sin(a)*r,Math.cos(a)*r,Math.sin(a)*r,'#ebffff',r*.2,1)}break
    }
    case 'psychic':case 'ghost':case 'fairy': {
      ctx.strokeStyle='#ffffff';ctx.beginPath();ctx.arc(0,0,r*.6,0,TAU);ctx.stroke()
      star(ctx,0,0,r*.62,0,color,1);break
    }
    case 'rock':case 'ground':case 'steel': {
      ctx.beginPath()
      for(let i=0;i<6;i++){const a=i*TAU/6;const d=r*(i%2?.88:1);if(i===0)ctx.moveTo(Math.cos(a)*d,Math.sin(a)*d);else ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d)}
      ctx.closePath();ctx.fill();break
    }
    default:star(ctx,0,0,r,0,color,1,5)
  }
  ctx.restore()
}

function typeOrbits(ctx:CanvasRenderingContext2D,v:SkillVfx,cx:number,cy:number,age:number,strength:number) {
  const count = Math.min(12, 6+Math.floor(v.scale*3))
  for(let i=0;i<count;i++){
    const angle=(i/count)*TAU+(i%2?-1:1)*age*2.5
    const spread=(17+i%4*10+age*45)*v.scale
    const pos=point(angle,spread)
    const flicker=.6+.4*Math.sin(i*3+age*15)
    typeMark(ctx,cx+pos.x,cy+pos.y*.65,Math.max(3,6*v.scale*(1-age*.52)),v.type,angle+age*3,flicker*strength)
  }
}

export function drawSkillVfx(ctx:CanvasRenderingContext2D,v:SkillVfx,time:number):void{
  const age=(time-v.t0)/v.duration
  if(age<0||age>=1)return
  const color=TYPE_COLOR[v.type]
  const k=Math.max(0,Math.min(1,age)),inOut=Math.min(1,k*5,(1-k)*3)
  const dx=v.toX-v.fromX,dy=v.toY-v.fromY
  const d=Math.hypot(dx,dy)||1, ux=dx/d,uy=dy/d
  const rad=(n:number)=>n*v.scale
  ctx.save()
  ctx.globalCompositeOperation='lighter'
  const pulse=.84+.16*Math.sin((k*TAU)*7)
  const strength=inOut*pulse
  // Every cast has an unmistakable source charge, even for small punches.
  glow(ctx,v.fromX,v.fromY,rad(44)+8*Math.sin(k*TAU),color,.7*strength)
  ring(ctx,v.fromX,v.fromY,rad(18+15*k),'#ffffff',.62*strength,2,1)
  if(v.shape==='support'){
    const destX=v.friendly?v.fromX:v.toX, destY=v.friendly?v.fromY:v.toY
    glow(ctx,destX,destY,rad(118)*(1+.3*k),color,.75*strength)
    for(let i=0;i<3;i++)ring(ctx,destX,destY,rad(24+100*((k+i/3)%1)),i===1?'#ffffff':color,(1-(k+i/3)%1)*.65,3,1)
    typeOrbits(ctx,v,destX,destY,k,strength)
  } else if(v.shape==='beam'){
    const extension=Math.min(1,k*5)
    const ex=v.fromX+dx*extension,ey=v.fromY+dy*extension
    const fat=rad(14+12*(1-k)) * pulse
    streak(ctx,v.fromX,v.fromY,ex,ey,color,fat*2,.22*strength)
    streak(ctx,v.fromX,v.fromY,ex,ey,color,fat,.88*strength)
    streak(ctx,v.fromX,v.fromY,ex,ey,'#ffffff',Math.max(3,fat*.3),strength)
    for(let i=1;i<7;i++){
      const f=(i/7)*extension,px=v.fromX+dx*f,py=v.fromY+dy*f
      ring(ctx,px,py,rad(13+3*Math.sin(i+k*14)),i%2?'#fff':color,.7*strength,3,1)
      if(v.type==='electric')bolt(ctx,px-uy*16,py+ux*16,px+uy*16,py-ux*16,'#fffde8',.75*strength,4,2)
    }
    glow(ctx,ex,ey,rad(58),color,.75*strength)
  } else if(v.shape==='strike'){
    const radius=rad(46+24*k)
    const cx=v.toX,cy=v.toY
    glow(ctx,cx,cy,radius*1.6,color,.56*strength)
    for(let i=0;i<3;i++){
      const angle=-1.3+i*.85+k*.32
      ctx.save();ctx.translate(cx,cy);ctx.rotate(angle)
      ctx.strokeStyle=i%2?'#ffffff':color;ctx.lineWidth=rad(7-i)
      ctx.globalAlpha=.75*strength
      ctx.beginPath();ctx.arc(0,0,radius+i*9,-1.1,-.05);ctx.stroke()
      ctx.restore()
    }
    ring(ctx,cx,cy,rad(22+80*k),'#fff8c7',(1-k)*strength,4,.55)
    typeOrbits(ctx,v,cx,cy,k,.5*strength)
  } else if(v.shape==='dash'){
    const f=Math.min(1,k*2),hx=v.fromX+dx*f,hy=v.fromY+dy*f
    for(let i=0;i<5;i++){
      const t=Math.max(0,f-i*.13),x=v.fromX+dx*t,y=v.fromY+dy*t
      streak(ctx,x-ux*rad(65),y-uy*rad(65),x+ux*rad(12),y+uy*rad(12),i%2?'#ffffff':color,rad(14-i*1.8),(.15+(.8-i*.13))*strength)
    }
    glow(ctx,hx,hy,rad(75),color,.9*strength)
    typeOrbits(ctx,v,hx,hy,k,.6*strength)
  } else if(v.shape==='cone'){
    const len=rad(195*Math.min(1,k*3)),half=rad(80+70*k)
    const nx=-uy,ny=ux
    ctx.save();ctx.globalAlpha=.28*strength;ctx.fillStyle=color
    ctx.beginPath();ctx.moveTo(v.fromX,v.fromY)
    ctx.lineTo(v.fromX+ux*len+nx*half,v.fromY+uy*len+ny*half)
    ctx.lineTo(v.fromX+ux*len-nx*half,v.fromY+uy*len-ny*half)
    ctx.closePath();ctx.fill();ctx.restore()
    for(let i=0;i<9;i++){
      const t=Math.min(1,(k*1.8+i*.094)%1),spread=(rand(v.seed+i*7)-.5)*half*2
      const px=v.fromX+ux*len*t+nx*spread*t,py=v.fromY+uy*len*t+ny*spread*t
      typeMark(ctx,px,py,rad(10),v.type,k*8+i,.86*strength)
    }
  } else if(v.shape==='burst'||v.shape==='wave'){
    const radius=rad(v.shape==='burst'?175:160)
    const cx=v.toX,cy=v.toY
    glow(ctx,cx,cy,rad(158),color,(1-k)*.8*strength)
    for(let i=0;i<3;i++){
      const progress=(k+i*.22)%1
      ring(ctx,cx,cy,radius*progress,i%2?'#ffffff':color,(1-progress)*.8*strength,rad(8-i*2),.46)
    }
    for(let i=0;i<15;i++){
      const angle=i*TAU/15+rand(v.seed+i)*.17
      const position=point(angle,radius*k*(.72+.32*rand(i*131+v.seed)))
      const px=cx+position.x,py=cy+position.y*.65
      streak(ctx,px,py,px+Math.cos(angle)*rad(25),py+Math.sin(angle)*rad(18),i%3?'#ffffff':color,rad(4),strength*(1-k))
      if(i%2===0)typeMark(ctx,px,py,rad(10),v.type,angle+k*4,(1-k)*strength)
    }
    star(ctx,cx,cy,rad(30+12*(1-k)),k*4,'#ffffff',.6*strength,7)
  } else {
    // Comets, blobs, magic orbs and multi-hit streams move along a genuinely
    // curved 2D path. Each skill gets distinct phase and particle orientation.
    const t=Math.min(1,k*1.6),px=v.fromX+dx*t,py=v.fromY+dy*t-Math.sin(t*Math.PI)*rad(30)
    for(let i=0;i<7;i++){
      const tailT=Math.max(0,t-i*.075)
      const x=v.fromX+dx*tailT,y=v.fromY+dy*tailT-Math.sin(tailT*Math.PI)*rad(30)
      glow(ctx,x,y,rad(31-i*3),color,(.75-i*.08)*strength)
      if(i%2===0)star(ctx,x,y,rad(7-i*.5),k*8,color,strength)
    }
    glow(ctx,px,py,rad(52),color,strength)
    star(ctx,px,py,rad(20),k*5,'#ffffff',strength)
    typeOrbits(ctx,v,px,py,k,.5*strength)
  }
  // Move-specific accent details provide recognizable Fire/Water/Electric etc.
  if(v.type==='electric'&&k>.08){
    for(let i=0;i<3;i++){
      const ang=i*TAU/3+k*6,start=point(ang,rad(12)),end=point(ang+Math.sin(k*13+i)*.2,rad(78))
      bolt(ctx,v.toX+start.x,v.toY+start.y,v.toX+end.x,v.toY+end.y,'#fffded',.55*strength,6,rad(2.8))
    }
  } else if(v.type==='ice'){
    for(let i=0;i<4;i++){
      const a=i*TAU/4+k*2,p=point(a,rad(47+30*k))
      star(ctx,v.toX+p.x,v.toY+p.y,rad(14),a,'#e9ffff',strength,6)
    }
  } else if(v.type==='fire'){
    for(let i=0;i<6;i++){
      const a=i*TAU/6,p=point(a,rad(38+32*k))
      typeMark(ctx,v.toX+p.x,v.toY+p.y-8*(.5+i%3),rad(10+4*(1-k)),v.type,a,strength*(1-k*.45))
    }
  }
  ctx.restore()
}

export function drawImpactVfx(ctx: CanvasRenderingContext2D,x:number,y:number,color:string,age:number,radius=84):void {
  if(age<0||age>1)return
  ctx.save()
  ctx.globalCompositeOperation='lighter'
  const power=1-age
  glow(ctx,x,y,radius*(.75+age*.65),color,power*.92)
  ring(ctx,x,y,radius*age*1.45,'#ffffff',power*.88,7,1)
  ring(ctx,x,y,radius*age*1.1,color,power*.75,5,.65)
  for(let i=0;i<12;i++){
    const theta=i*TAU/12+age*.35
    const a=point(theta,radius*age*(.9+.25*rand(i*1.9)))
    streak(ctx,x+a.x*.6,y+a.y*.6,x+a.x*1.25,y+a.y*1.25,i%3?'#ffffff':color,5,power*.84)
  }
  ctx.restore()
}
