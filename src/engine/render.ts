import { type Battle, type FxEvent, isBuffed, type Unit } from './battle'
import { backSprite, frontSprite } from '../data/sprites'
import { TYPE_COLOR } from '../lib/typeChart'
import type { Theme } from '../lib/stages'
import { drawBattleWorld, flush } from '../art/world'
import { iconCanvas } from '../art/icons'
import { STATUS_INFO } from '../lib/moveSet'
import { H, rect, W } from './draw'

export { H, W }

// ---------- 스프라이트 캐시 (PokeAPI 이미지를 런타임에 불러온다) ----------
const cache = new Map<string, HTMLImageElement>()
export function sprite(url: string): HTMLImageElement {
  let img = cache.get(url)
  if (!img) {
    img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    cache.set(url, img)
  }
  return img
}
export const preload = (ids: number[]) => ids.forEach(id => { sprite(frontSprite(id)); sprite(backSprite(id)) })

export const SLOT_COLORS = ['#e8524a', '#3fbf6a', '#3f7fe8']

// ---------- 연출 상태 ----------
interface Proj { x0: number; y0: number; x1: number; y1: number; t0: number; dur: number; color: string; big: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Floater { x: number; y: number; text: string; color: string; t0: number; big: boolean }
interface Slash { x: number; y: number; t0: number; color: string }

export interface Visual {
  scroll: number
  shake: number
  projs: Proj[]
  parts: Particle[]
  floats: Floater[]
  slashes: Slash[]
  banner: { text: string; t0: number; tone?: 'info' | 'warn' | 'boss' } | null
}
export const newVisual = (): Visual => ({ scroll: 0, shake: 0, projs: [], parts: [], floats: [], slashes: [], banner: null })

/** 엔진이 쌓아 둔 이벤트를 시각 효과로 바꾼다 */
export function consumeEvents(b: Battle, v: Visual, now: number, hooks: { hit: (e: Extract<FxEvent, { k: 'hit' }>) => void; special: () => void; faint: () => void; wave: (boss: boolean) => void }) {
  for (const e of b.events) {
    if (e.k === 'attack') {
      const from = b.units.find(u => u.uid === e.from)
      if (!from) continue
      if (e.special) hooks.special()
      for (const tid of e.to) {
        const to = b.units.find(u => u.uid === tid)
        if (!to) continue
        if (e.ranged || e.special) {
          const d = Math.hypot(to.x - from.x, to.y - from.y)
          v.projs.push({ x0: from.x, y0: from.y - 40, x1: to.x, y1: to.y - 40, t0: now, dur: Math.max(0.12, d / 560), color: TYPE_COLOR[e.type], big: e.special })
        }
      }
    } else if (e.k === 'hit') {
      const to = b.units.find(u => u.uid === e.to)
      if (!to) continue
      const cx = to.x, cy = to.y - 40
      const color = TYPE_COLOR[e.type]
      for (let i = 0; i < (e.special ? 16 : 8); i++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 90
        v.parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5, max: 0.5, color, size: 4 + Math.floor(Math.random() * 3) })
      }
      v.slashes.push({ x: cx, y: cy, t0: now, color })
      const txt = e.amount === 0 ? '효과 없음' : String(e.amount) + (e.crit ? '!' : '')
      v.floats.push({ x: cx + (Math.random() * 20 - 10), y: cy - 40, text: txt, color: e.crit ? '#ffe14d' : e.eff > 1 ? '#ff7a45' : e.eff < 1 ? '#c9c9d9' : '#ffffff', t0: now, big: e.crit || e.eff > 1 })
      if (e.special || to.boss) v.shake = Math.max(v.shake, e.special ? 7 : 3)
      hooks.hit(e)
    } else if (e.k === 'faint') {
      hooks.faint()
    } else if (e.k === 'heal') {
      const u = b.units.find(x => x.uid === e.uid)
      if (u) v.floats.push({ x: u.x, y: u.y - 90, text: `+${e.amount}`, color: '#6dff8a', t0: now, big: false })
    } else if (e.k === 'banner') {
      v.banner = { text: e.text, t0: now, tone: e.tone }
      hooks.wave(e.tone === 'boss')
    } else if (e.k === 'status') {
      const u = b.units.find(x => x.uid === e.uid)
      if (u) v.floats.push({ x: u.x, y: u.y - 100, text: STATUS_INFO[e.kind].name + '!', color: STATUS_INFO[e.kind].color, t0: now, big: true })
    } else if (e.k === 'buff') {
      const u = b.units.find(x => x.uid === e.uid)
      if (u) v.floats.push({ x: u.x, y: u.y - 100, text: e.good ? '능력 UP' : '능력 DOWN', color: e.good ? '#7dffb0' : '#ff8a8a', t0: now, big: false })
    } else if (e.k === 'wave') {
      const boss = b.waves[e.index].some(x => x.boss)
      v.banner = { text: boss ? 'BOSS 출현!' : `WAVE ${e.index + 1} / ${b.waves.length}`, t0: now }
      hooks.wave(boss)
    }
  }
  b.events.length = 0
}

function hpColor(r: number, ally: boolean) { return ally ? '#46d2ff' : r > 0.5 ? '#ee4b4b' : '#ff7a3a' }

function drawUnit(ctx: CanvasRenderingContext2D, b: Battle, u: Unit, t: number) {
  const ally = u.side === 'ally'
  const scale = u.boss ? 2.2 : 1.1
  const size = 96 * scale
  const hop = u.alive && u.moving ? Math.abs(Math.sin(t * 11 + u.uid)) * 7 : u.alive ? Math.sin(t * 3 + u.uid) * 1.5 : 0
  let ox = 0
  if (u.lunge > 0) ox += u.face * Math.sin((1 - u.lunge / 0.3) * Math.PI) * 16
  if (u.hurt > 0) ox += (Math.random() - 0.5) * 6
  let alpha = 1
  let oy = -hop
  if (!u.alive) { alpha = Math.max(0, 1 - u.deadT * 1.6); oy += u.deadT * 20 }
  else if (u.hurt > 0 && Math.floor(u.hurt * 30) % 2 === 0) alpha = 0.45
  if (alpha <= 0) return

  // 발밑: 그림자 + 아군은 파티 색 링
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath(); ctx.ellipse(u.x, u.y, u.radius * 0.95, u.radius * 0.38, 0, 0, Math.PI * 2); ctx.fill()
  if (ally && u.alive) {
    ctx.strokeStyle = SLOT_COLORS[u.slot % 3]; ctx.lineWidth = 4
    ctx.beginPath(); ctx.ellipse(u.x, u.y, u.radius * 1.15, u.radius * 0.5, 0, 0, Math.PI * 2); ctx.stroke()
  }
  const img = sprite(frontSprite(u.speciesId))
  const flip = ally ? u.face === 1 : u.face === 1 // 앞모습 스프라이트는 기본 왼쪽을 본다 → 오른쪽을 볼 때 뒤집기
  if (img.complete && img.naturalWidth) {
    ctx.save()
    ctx.translate(Math.floor(u.x + ox), Math.floor(u.y + oy))
    if (flip) ctx.scale(-1, 1)
    ctx.drawImage(img, -size / 2, -size + 12 * scale, size, size)
    ctx.restore()
  } else {
    rect(ctx, u.x - 20, u.y - 60, 40, 56, '#888')
  }
  ctx.globalAlpha = 1
  if (!u.alive) return
  // HP 바 + 이름
  const bw = u.boss ? 130 : 62
  const bx = u.x - bw / 2
  const by = u.y - size + 8 * scale + oy - 6
  rect(ctx, bx - 2, by - 2, bw + 4, 10, '#1a1a2a')
  rect(ctx, bx, by, bw, 6, '#555a6a')
  const r = u.hp / u.maxHp
  rect(ctx, bx, by, bw * r, 6, hpColor(r, ally))
  ctx.font = '13px Galmuri11, Galmuri9, monospace'
  ctx.textAlign = 'center'
  ctx.lineWidth = 3
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#fff'
  const label = u.name
  ctx.strokeText(label, u.x, by - 6); ctx.fillText(label, u.x, by - 6)
  if (isBuffed(b, u)) ctx.drawImage(iconCanvas('up'), Math.floor(u.x + bw / 2 + 4), Math.floor(by - 8), 24, 24)
  if (u.status) {
    const info = STATUS_INFO[u.status.kind]
    const w = 44
    rect(ctx, u.x - w / 2 - 2, by + 12, w + 4, 18, '#1a1a2a')
    rect(ctx, u.x - w / 2, by + 14, w, 14, info.color)
    ctx.fillStyle = '#1a1a2a'; ctx.font = '12px Galmuri11, Galmuri9, monospace'
    ctx.fillText(info.short, u.x, by + 25)
  } else if (b.t < u.debuff.until) {
    ctx.fillStyle = '#ff6a6a'; ctx.font = '14px Galmuri11, Galmuri9, monospace'
    ctx.strokeText('DOWN', u.x, by + 24); ctx.fillText('DOWN', u.x, by + 24)
  }
  if (ally && u.spCd <= 0 && b.phase === 'fight' && Math.floor(t * 4) % 2 === 0) {
    ctx.drawImage(iconCanvas('star'), Math.floor(u.x - 12), Math.floor(by - 44), 24, 24)
  }
}

export function drawBattle(ctx: CanvasRenderingContext2D, b: Battle, v: Visual, theme: Theme, now: number, dt: number) {
  ctx.imageSmoothingEnabled = false
  v.shake = Math.max(0, v.shake - dt * 30)
  v.scroll += (b.phase === 'advance' ? 240 : 0) * dt
  for (const p of v.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt }
  v.parts = v.parts.filter(p => p.life > 0)
  v.projs = v.projs.filter(p => now - p.t0 < p.dur + 0.02)
  v.floats = v.floats.filter(f => now - f.t0 < 0.9)
  v.slashes = v.slashes.filter(s => now - s.t0 < 0.25)

  ctx.save()
  if (v.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * v.shake), Math.round((Math.random() - 0.5) * v.shake))
  drawBattleWorld(theme, v.scroll, now)
  flush(ctx)

  for (const u of [...b.units].sort((a, c) => a.y - c.y)) drawUnit(ctx, b, u, now)

  for (const s of v.slashes) {
    const k = (now - s.t0) / 0.25
    ctx.globalAlpha = 1 - k
    for (let i = -3; i <= 3; i++) {
      rect(ctx, Math.round((s.x + i * 6) / 3) * 3, Math.round((s.y + i * 6) / 3) * 3, 6, 6, '#fff')
      rect(ctx, Math.round((s.x + i * 6) / 3) * 3, Math.round((s.y - i * 6) / 3) * 3, 6, 6, s.color)
    }
  }
  ctx.globalAlpha = 1

  for (const p of v.projs) {
    const k = Math.min(1, (now - p.t0) / p.dur)
    const x = Math.round((p.x0 + (p.x1 - p.x0) * k) / 3) * 3, y = Math.round((p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 18) / 3) * 3
    const s = p.big ? 18 : 9
    rect(ctx, x - s / 2, y - s / 2, s, s, p.color)
    rect(ctx, x - s / 2, y - s / 2, s, 3, '#fff8')
    rect(ctx, x - s / 6, y - s / 6, s / 3, s / 3, '#fff')
  }
  for (const q of v.parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); rect(ctx, Math.round(q.x / 3) * 3, Math.round(q.y / 3) * 3, 3 * Math.ceil(q.size / 3), 3 * Math.ceil(q.size / 3), q.color) }
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  for (const f of v.floats) {
    const k = (now - f.t0) / 0.9
    ctx.font = `${f.big ? 28 : 20}px Galmuri11, monospace`
    ctx.globalAlpha = 1 - k * k
    ctx.lineWidth = 5; ctx.strokeStyle = '#000'
    const y = f.y - k * 40
    ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y)
  }
  ctx.globalAlpha = 1
  ctx.restore()

  if (v.banner && now - v.banner.t0 < 1.7) {
    const k = now - v.banner.t0
    ctx.globalAlpha = k < 0.2 ? k / 0.2 : k > 1.3 ? Math.max(0, (1.7 - k) / 0.4) : 1
    const tone = v.banner.tone
    rect(ctx, 0, 200, W, 64, tone === 'boss' ? 'rgba(200,30,50,0.88)' : tone === 'warn' ? 'rgba(230,110,20,0.88)' : tone === 'info' ? 'rgba(40,150,220,0.88)' : 'rgba(255,170,0,0.85)')
    rect(ctx, 0, 200, W, 4, '#fff3b0'); rect(ctx, 0, 260, W, 4, '#c97b00')
    ctx.font = '32px Galmuri11, monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 6; ctx.strokeStyle = tone === 'boss' ? '#5a0010' : '#6a3300'
    ctx.strokeText(v.banner.text, W / 2, 245); ctx.fillStyle = '#fff'; ctx.fillText(v.banner.text, W / 2, 245)
    ctx.globalAlpha = 1
  }
}
