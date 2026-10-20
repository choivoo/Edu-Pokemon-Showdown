import type { Battle, FxEvent, Unit } from './battle'
import { PROJECTILE_TIME } from './battle'
import { backSprite, frontSprite } from '../data/sprites'
import { TYPE_COLOR } from '../lib/typeChart'
import type { Theme } from '../lib/stages'

export const W = 480
export const H = 340

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

// ---------- 연출 상태 ----------
interface Proj { x0: number; y0: number; x1: number; y1: number; t0: number; color: string; big: boolean }
interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
interface Floater { x: number; y: number; text: string; color: string; t0: number; big: boolean }

export interface Visual {
  scroll: number
  shake: number
  projs: Proj[]
  parts: Particle[]
  floats: Floater[]
  banner: { text: string; t0: number } | null
}
export const newVisual = (): Visual => ({ scroll: 0, shake: 0, projs: [], parts: [], floats: [], banner: null })

const UNIT_SCALE = 1.4
const BOSS_SCALE = 2.4
const YS = [262, 212, 312]

/** 유닛의 화면 위치(발 기준) */
export function pos(u: Unit): { x: number; y: number; scale: number } {
  if (u.side === 'ally') return { x: [190, 105, 105][u.slot], y: YS[u.slot], scale: UNIT_SCALE }
  if (u.boss) return { x: W - 130, y: 318, scale: BOSS_SCALE }
  return { x: [W - 190, W - 105, W - 105][u.slot], y: YS[u.slot], scale: UNIT_SCALE }
}
const bossPresent = (b: Battle) => b.units.some(u => u.side === 'enemy' && u.boss && u.alive)
function enemyPos(b: Battle, u: Unit) {
  if (u.boss) return pos(u)
  if (bossPresent(b)) return { x: W - 285, y: [212, 212, 312][u.slot] ?? 212, scale: UNIT_SCALE }
  return pos(u)
}
const where = (b: Battle, u: Unit) => (u.side === 'enemy' ? enemyPos(b, u) : pos(u))

/** 엔진이 쌓아 둔 이벤트를 시각 효과로 바꾼다 */
export function consumeEvents(b: Battle, v: Visual, now: number, sfxHooks: { hit: (e: Extract<FxEvent, { k: 'hit' }>) => void; special: () => void; faint: () => void; wave: (boss: boolean) => void }) {
  for (const e of b.events) {
    if (e.k === 'attack') {
      const from = b.units.find(u => u.uid === e.from)
      if (!from) continue
      const p0 = where(b, from)
      if (e.special) sfxHooks.special()
      for (const tid of e.to) {
        const to = b.units.find(u => u.uid === tid)
        if (!to) continue
        const p1 = where(b, to)
        v.projs.push({ x0: p0.x, y0: p0.y - 45 * p0.scale, x1: p1.x, y1: p1.y - 45 * p1.scale, t0: now, color: TYPE_COLOR[e.type], big: e.special })
      }
    } else if (e.k === 'hit') {
      const to = b.units.find(u => u.uid === e.to)
      if (!to) continue
      const p = where(b, to)
      const cx = p.x, cy = p.y - 45 * p.scale
      const color = TYPE_COLOR[e.type]
      for (let i = 0; i < (e.special ? 16 : 8); i++) {
        const a = Math.random() * Math.PI * 2, sp = 40 + Math.random() * 90
        v.parts.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5, max: 0.5, color, size: 3 + Math.floor(Math.random() * 3) })
      }
      const txt = e.amount === 0 ? '효과 없음' : String(e.amount) + (e.crit ? '!' : '')
      v.floats.push({ x: cx + (Math.random() * 16 - 8), y: cy - 30 * p.scale, text: txt, color: e.crit ? '#ffe14d' : e.eff > 1 ? '#ff7a45' : e.eff < 1 ? '#b9b9c9' : '#ffffff', t0: now, big: e.crit || e.eff > 1 })
      if (e.special || to.boss) v.shake = Math.max(v.shake, e.special ? 6 : 3)
      sfxHooks.hit(e)
    } else if (e.k === 'faint') {
      sfxHooks.faint()
    } else if (e.k === 'heal') {
      const u = b.units.find(x => x.uid === e.uid)
      if (u) { const p = where(b, u); v.floats.push({ x: p.x, y: p.y - 90, text: `+${e.amount}`, color: '#6dff8a', t0: now, big: false }) }
    } else if (e.k === 'wave') {
      const boss = b.waves[e.index].some(x => x.boss)
      v.banner = { text: boss ? '⚠ BOSS 출현!' : `WAVE ${e.index + 1} / ${b.waves.length}`, t0: now }
      sfxHooks.wave(boss)
    }
  }
  b.events.length = 0
}

// ---------- 배경 ----------
interface ThemeDef { sky: [string, string]; ground: [string, string]; far: string; near: string; accent: string }
const THEMES: Record<Theme, ThemeDef> = {
  beach: { sky: ['#6ec8ff', '#d6f3ff'], ground: ['#f2dc9b', '#e8cd85'], far: '#4aa6e8', near: '#2f8a4a', accent: '#ffffff' },
  forest: { sky: ['#9bd8a4', '#e3f6d0'], ground: ['#5aa04a', '#4f9341'], far: '#2f6d3d', near: '#1f5a2f', accent: '#b8ff9a' },
  cave: { sky: ['#1a1830', '#35305c'], ground: ['#4b4566', '#433d5c'], far: '#2a2648', near: '#5c5486', accent: '#9a8cff' },
  gorge: { sky: ['#3a3f6b', '#8a8fc0'], ground: ['#8b8576', '#7d7768'], far: '#5a5d86', near: '#6e6a5e', accent: '#fff36b' },
  volcano: { sky: ['#4a1a1a', '#e0602a'], ground: ['#4a3030', '#3d2828'], far: '#6b2a22', near: '#8a3a22', accent: '#ffb347' },
  altar: { sky: ['#0b0b2a', '#3b2a7a'], ground: ['#5a5280', '#4f4876'], far: '#2a2060', near: '#6a5cb0', accent: '#fff6a8' },
}

function lerp(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16)
  const c = (s: number) => Math.round(((pa >> s) & 255) * (1 - t) + ((pb >> s) & 255) * t)
  return `rgb(${c(16)},${c(8)},${c(0)})`
}
const rect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h)) }
const tri = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string, down = false) => {
  ctx.fillStyle = c; ctx.beginPath()
  if (down) { ctx.moveTo(Math.floor(x), Math.floor(y)); ctx.lineTo(Math.floor(x + w), Math.floor(y)); ctx.lineTo(Math.floor(x + w / 2), Math.floor(y + h)) }
  else { ctx.moveTo(Math.floor(x), Math.floor(y)); ctx.lineTo(Math.floor(x + w), Math.floor(y)); ctx.lineTo(Math.floor(x + w / 2), Math.floor(y - h)) }
  ctx.fill()
}

function drawBackground(ctx: CanvasRenderingContext2D, theme: Theme, scroll: number, t: number) {
  const th = THEMES[theme]
  // 하늘: 띠 모양 그라데이션(도트 느낌)
  for (let i = 0; i < 12; i++) rect(ctx, 0, i * 16, W, 16, lerp(th.sky[0], th.sky[1], i / 11))
  const horizon = 180
  // 먼 풍경
  const farStep = 150, farOff = -((scroll * 0.2) % farStep)
  for (let x = farOff - farStep; x < W + farStep; x += farStep) {
    if (theme === 'beach') { rect(ctx, x, horizon - 18, farStep, 22, th.far); rect(ctx, x + 30, horizon - 34, 40, 16, '#3a8fd0'); rect(ctx, x + 90, horizon - 26, 30, 10, '#2f7fc0') }
    else if (theme === 'forest') { for (let k = 0; k < 3; k++) { tri(ctx, x + k * 48, horizon, 56, 90 - k * 8, th.far); tri(ctx, x + k * 48 + 8, horizon - 24, 40, 56, '#3f8a4f') } }
    else if (theme === 'cave') { for (let k = 0; k < 5; k++) tri(ctx, x + k * 32, 0, 24 + (k % 2) * 10, 40 + ((k * 37) % 50), th.far, true); for (let k = 0; k < 3; k++) rect(ctx, x + 20 + k * 50, horizon - 20 - k * 6, 8, 20, th.accent) }
    else if (theme === 'gorge') { rect(ctx, x, horizon - 70, 70, 70, th.far); rect(ctx, x + 70, horizon - 100, 50, 100, '#6a6d98'); rect(ctx, x + 120, horizon - 50, 30, 50, th.far) }
    else if (theme === 'volcano') { tri(ctx, x + 10, horizon, 130, 100, th.far); tri(ctx, x + 55, horizon - 78, 40, 18, th.accent); rect(ctx, x + 72, horizon - 100, 6, 24, '#ffd37a') }
    else { for (let k = 0; k < 3; k++) { rect(ctx, x + 14 + k * 46, horizon - 90 + k * 12, 14, 90 - k * 12, th.near); rect(ctx, x + 10 + k * 46, horizon - 96 + k * 12, 22, 8, '#7d6fd0') } }
  }
  // 반짝이(별/반딧불/불씨)
  if (theme === 'altar' || theme === 'cave' || theme === 'volcano' || theme === 'gorge') {
    for (let i = 0; i < 18; i++) {
      const x = (i * 97 + scroll * 0.1) % W
      const y = theme === 'volcano' ? 170 - ((t * 20 + i * 31) % 150) : (i * 53) % 140
      if (Math.sin(t * 3 + i) > -0.2) rect(ctx, x, y, 2, 2, th.accent)
    }
  }
  if (theme === 'gorge' && Math.sin(t * 1.3) > 0.985) rect(ctx, 0, 0, W, horizon, 'rgba(255,255,200,0.35)')
  // 가까운 풍경
  const nearStep = 96, nearOff = -((scroll * 0.55) % nearStep)
  for (let x = nearOff - nearStep; x < W + nearStep; x += nearStep) {
    const k = Math.abs(Math.floor((x + scroll * 0.55) / nearStep)) % 3
    if (theme === 'beach') { rect(ctx, x + 40, horizon - 40, 5, 46, '#8a5a2b'); tri(ctx, x + 22, horizon - 36, 42, 16, th.near, true); tri(ctx, x + 28, horizon - 44, 30, 12, '#3fae5a', true) }
    else if (theme === 'forest') { rect(ctx, x + 40, horizon - 14, 8, 20, '#6b4423'); tri(ctx, x + 26, horizon - 8, 36, 40 + k * 6, th.near) }
    else if (theme === 'cave') { tri(ctx, x + 30, horizon + 6, 26, 30 + k * 10, th.near); tri(ctx, x + 56, horizon + 6, 18, 20, '#6d65a0') }
    else if (theme === 'gorge') { rect(ctx, x + 30, horizon - 18 - k * 6, 24, 24 + k * 6, th.near); rect(ctx, x + 34, horizon - 24 - k * 6, 16, 8, '#8b867a') }
    else if (theme === 'volcano') { rect(ctx, x + 30, horizon - 10, 26, 16, th.near); rect(ctx, x + 34, horizon - 6, 6, 3, th.accent) }
    else { rect(ctx, x + 36, horizon - 22, 10, 28, th.near); rect(ctx, x + 32, horizon - 28, 18, 6, th.accent) }
  }
  // 바닥 타일
  rect(ctx, 0, horizon, W, H - horizon, th.ground[0])
  const tile = 32, gOff = -(scroll % (tile * 2))
  for (let y = horizon, row = 0; y < H; y += 32, row++) {
    for (let x = gOff - tile * 2; x < W + tile; x += tile * 2) rect(ctx, x + (row % 2) * tile, y, tile, 32, th.ground[1])
  }
  rect(ctx, 0, horizon, W, 3, 'rgba(0,0,0,0.25)')
  if (theme === 'beach') { rect(ctx, 0, horizon + 2, W, 5, 'rgba(255,255,255,0.35)') }
}

// ---------- 유닛 ----------
function hpColor(r: number) { return r > 0.5 ? '#3ddc5a' : r > 0.2 ? '#f5d02e' : '#ee3b3b' }

function drawUnit(ctx: CanvasRenderingContext2D, b: Battle, u: Unit, t: number) {
  const p = where(b, u)
  const dir = u.side === 'ally' ? 1 : -1
  const walking = b.phase === 'advance' && u.side === 'ally'
  const bob = u.alive ? Math.sin(t * (walking ? 12 : 3) + u.uid) * (walking ? 4 : 2) : 0
  let ox = 0, oy = bob
  if (u.lunge > 0) ox += dir * Math.sin((1 - u.lunge / 0.3) * Math.PI) * 16
  if (u.hurt > 0) ox += (Math.random() - 0.5) * 6
  let alpha = 1
  if (!u.alive) { alpha = Math.max(0, 1 - u.deadT * 1.6); oy += u.deadT * 24 }
  else if (u.hurt > 0 && Math.floor(u.hurt * 30) % 2 === 0) alpha = 0.4
  if (alpha <= 0) return
  const s = p.scale
  const size = 96 * s
  // 그림자
  ctx.globalAlpha = alpha * 0.28
  ctx.fillStyle = '#000'
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 30 * s, 8 * s, 0, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = alpha
  const img = sprite(u.side === 'ally' ? backSprite(u.speciesId) : frontSprite(u.speciesId))
  if (img.complete && img.naturalWidth) {
    ctx.drawImage(img, Math.floor(p.x - size / 2 + ox), Math.floor(p.y - size + 10 * s + oy), size, size)
  } else {
    rect(ctx, p.x - 20 + ox, p.y - 60 + oy, 40, 56, '#888')
  }
  ctx.globalAlpha = 1
  if (!u.alive) return
  // HP 바
  const bw = u.boss ? 96 : 56, bx = p.x - bw / 2, by = p.y - size + 4 * s + oy - (u.boss ? 4 : 0)
  rect(ctx, bx - 1, by - 1, bw + 2, 8, '#000')
  rect(ctx, bx, by, bw, 6, '#444')
  const r = u.hp / u.maxHp
  rect(ctx, bx, by, bw * r, 6, hpColor(r))
  ctx.font = '11px Galmuri9, monospace'
  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 3
  const label = `Lv${u.level} ${u.name}`
  ctx.strokeText(label, p.x, by - 4); ctx.fillText(label, p.x, by - 4)
  if (u.side === 'ally' && u.spCd <= 0 && b.phase === 'fight' && Math.floor(t * 4) % 2 === 0) {
    ctx.font = '12px monospace'; ctx.fillStyle = '#ffe14d'; ctx.strokeText('★', p.x, by - 16); ctx.fillText('★', p.x, by - 16)
  }
}

export function drawBattle(ctx: CanvasRenderingContext2D, b: Battle, v: Visual, theme: Theme, now: number, dt: number) {
  ctx.imageSmoothingEnabled = false
  // 연출 업데이트
  v.shake = Math.max(0, v.shake - dt * 30)
  v.scroll += (b.phase === 'advance' ? 190 : 6) * dt
  for (const p of v.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt }
  v.parts = v.parts.filter(p => p.life > 0)
  v.projs = v.projs.filter(p => now - p.t0 < PROJECTILE_TIME + 0.02)
  v.floats = v.floats.filter(f => now - f.t0 < 0.9)

  ctx.save()
  if (v.shake > 0) ctx.translate(Math.round((Math.random() - 0.5) * v.shake), Math.round((Math.random() - 0.5) * v.shake))
  drawBackground(ctx, theme, v.scroll, now)

  const order = [...b.units].sort((a, c) => where(b, a).y - where(b, c).y)
  for (const u of order) drawUnit(ctx, b, u, now)

  for (const p of v.projs) {
    const k = Math.min(1, (now - p.t0) / PROJECTILE_TIME)
    const x = p.x0 + (p.x1 - p.x0) * k, y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * 14
    const s = p.big ? 12 : 7
    rect(ctx, x - s / 2, y - s / 2, s, s, p.color)
    rect(ctx, x - s / 4, y - s / 4, s / 2, s / 2, '#fff')
  }
  for (const q of v.parts) { ctx.globalAlpha = Math.max(0, q.life / q.max); rect(ctx, q.x, q.y, q.size, q.size, q.color) }
  ctx.globalAlpha = 1

  ctx.textAlign = 'center'
  for (const f of v.floats) {
    const k = (now - f.t0) / 0.9
    ctx.font = `${f.big ? 18 : 13}px Galmuri11, monospace`
    ctx.globalAlpha = 1 - k * k
    ctx.lineWidth = 4; ctx.strokeStyle = '#000'
    const y = f.y - k * 34
    ctx.strokeText(f.text, f.x, y); ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, y)
  }
  ctx.globalAlpha = 1
  ctx.restore()

  if (v.banner && now - v.banner.t0 < 1.6) {
    const k = now - v.banner.t0
    ctx.globalAlpha = k < 0.2 ? k / 0.2 : k > 1.2 ? Math.max(0, (1.6 - k) / 0.4) : 1
    rect(ctx, 0, 112, W, 34, 'rgba(0,0,0,0.6)')
    ctx.font = '18px Galmuri11, monospace'; ctx.textAlign = 'center'; ctx.fillStyle = v.banner.text.startsWith('⚠') ? '#ff6a5a' : '#fff'
    ctx.fillText(v.banner.text, W / 2, 136)
    ctx.globalAlpha = 1
  }
}
