/** New hand-drawn Canvas 2D overworld for the original 11-area campaign. */
export const ORIGINAL_NODES = [
  { x: 120, y: 302 }, // 1: First Steppe
  { x: 271, y: 224 }, // 2
  { x: 271, y: 354 }, // 3
  { x: 429, y: 162 }, // 4
  { x: 429, y: 268 }, // 5
  { x: 429, y: 376 }, // 6
  { x: 603, y: 155 }, // 7
  { x: 603, y: 265 }, // 8
  { x: 603, y: 367 }, // 9
  { x: 768, y: 304 }, // 10
  { x: 826, y: 143 }, // 11 chamber
] as const
const connections = [
  [0,1], [0,2], [1,3], [1,4], [1,5], [2,3], [2,4], [2,5],
  [3,6], [3,7], [3,8], [3,9], [4,6], [4,7], [4,8], [5,7], [5,8], [5,9],
  [6,10], [7,10], [8,10], [9,10],
] as const

function box(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))
}

export function drawOriginalIsland(ctx: CanvasRenderingContext2D, time: number, unlocked: boolean[], cleared: boolean[]) {
  const water=ctx.createLinearGradient(0,0,960,540)
  water.addColorStop(0,'#65d5ed');water.addColorStop(0.5,'#319bd2');water.addColorStop(1,'#2672be')
  ctx.fillStyle=water;ctx.fillRect(0,0,960,540)

  // Rectangular foam tiles: a 2D reinterpretation rather than copying the 3D models.
  for(let i=0;i<200;i++){
    const x=(i*187+37)%978, y=(i*109+23)%546
    const blink=(Math.sin(time*1.4+i*3.1)+1)*0.5
    box(ctx,x-12,y,3+blink*10,2,i%3?'#ffffff26':'#d9ffff55')
  }
  for(const [a,b] of connections) {
    const p=ORIGINAL_NODES[a],q=ORIGINAL_NODES[b]
    const available=unlocked[a]&&unlocked[b]
    ctx.strokeStyle=available?'#fff4b880':'#1d638d60'
    ctx.lineWidth=available?9:6
    ctx.setLineDash([11,11]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()
  }
  ctx.setLineDash([])
  ORIGINAL_NODES.forEach((node,i)=>{
    const bright=unlocked[i],finished=cleared[i]
    const color=finished?'#f8d87a':i===10?'#9f83db':i===1||i===6?'#4caf62':i===2||i===9?'#e6c67d':i===4||i===8?'#887b9b':'#9ad46d'
    const x=node.x-63, y=node.y-31
    // Drop shadow and squared 3D-like coastline on a fully 2D canvas
    box(ctx,x+1,y+15,130,69,'#0e597a88')
    box(ctx,x-6,y+5,136,68,'#a97947')
    box(ctx,x-6,y,136,63,'#6b9148')
    box(ctx,x,y-7,124,58,color)
    box(ctx,x+7,y-7,8,58,'#ffffff26')
    box(ctx,x+115,y-2,9,52,'#0000001b')
    const fx=(i*29)%13
    for(let n=0;n<15;n++){
      const px=x+6+((n*29+fx)%110),py=y-3+((n*11+i)%45)
      box(ctx,px,py,4+(n%2)*2,3,bright?'#fff9e63b':'#213d4b30')
    }
    if(i===10){
      box(ctx,x+43,y-17,40,22,'#e8d7ff')
      box(ctx,x+48,y-23,30,14,'#976bb8')
      box(ctx,x+57,y-32,12,10,'#fdf4ff')
    }
    if(!bright){box(ctx,x-6,y-7,136,70,'#13274799')}
    if(finished) {
      box(ctx,x+112,y-17,14,21,'#e8ba42')
      box(ctx,x+114,y-23,10,8,'#fff2a0')
    }
  })
  // Ocean horizon and final-boss atmosphere
  box(ctx,0,0,960,76,'#11477744')
  box(ctx,0,449,960,91,'#092d5455')
}
