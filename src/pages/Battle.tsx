import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { type AllyInput, type Battle as BattleState, createBattle, step, useSpecial } from '../engine/battle'
import { consumeEvents, drawBattle, H, newVisual, preload, SLOT_COLORS, W } from '../engine/render'
import { AREAS, buildWaves } from '../lib/stages'
import { partyMons, statsOf } from '../lib/party'
import { bgm, sfx } from '../lib/sound'
import { TYPE_COLOR } from '../lib/typeChart'
import { Btn, Portrait } from '../ui/kit'

interface Hud {
  wave: number
  waves: number
  kills: number
  time: number
  phase: BattleState['phase']
  allies: { uid: number; id: number; name: string; level: number; hp: number; maxHp: number; cd: number; max: number; alive: boolean; slot: number; move: string; type: string }[]
}

const snapshot = (b: BattleState): Hud => ({
  wave: Math.min(b.wave + 1, b.waves.length), waves: b.waves.length, kills: b.kills, time: b.t, phase: b.phase,
  allies: b.units.filter(u => u.side === 'ally').sort((a, c) => a.slot - c.slot).map(u => ({
    uid: u.uid, id: u.speciesId, name: u.name, level: u.level, hp: u.hp, maxHp: u.maxHp, cd: u.spCd, max: u.spMax, alive: u.alive, slot: u.slot, move: u.special.name, type: u.special.type,
  })),
})

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`

export default function Battle() {
  const { stage, save, finishBattle, go } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  const battle = useRef<BattleState | null>(null)
  const visual = useRef(newVisual())
  const speed = useRef(1)
  const paused = useRef(false)
  const finished = useRef(false)
  const [hud, setHud] = useState<Hud | null>(null)
  const [uiSpeed, setUiSpeed] = useState(1)
  const [uiPaused, setUiPaused] = useState(false)
  const [auto, setAuto] = useState(false)
  const [quit, setQuit] = useState(false)

  useEffect(() => {
    if (!stage) return
    const allies: AllyInput[] = partyMons(save).map(o => ({ ownedId: o.id, speciesId: o.species, level: o.level, stats: statsOf(save, o) }))
    const waves = buildWaves(stage)
    preload([...allies.map(a => a.speciesId), ...waves.flat().map(w => w.species)])
    const b = createBattle(allies, waves)
    battle.current = b
    setHud(snapshot(b))
    bgm.play('battle')

    const ctx = canvas.current!.getContext('2d')!
    const theme = stage.area >= 0 ? AREAS[stage.area].theme : (['beach', 'forest', 'cave', 'gorge', 'volcano', 'altar'] as const)[stage.index % 6]
    let raf = 0
    let last = performance.now()
    let acc = 0
    let hudT = 0
    let endT = 0
    const hooks = {
      hit: (e: { eff: number; crit: boolean }) => (e.crit ? sfx.crit() : e.eff > 1 ? sfx.superHit() : sfx.hit()),
      special: () => sfx.special(),
      faint: () => sfx.faint(),
      wave: (boss: boolean) => (boss ? sfx.crit() : sfx.step()),
    }
    const loop = (nowMs: number) => {
      const real = Math.min(0.1, (nowMs - last) / 1000)
      last = nowMs
      const dt = paused.current ? 0 : real * speed.current
      acc += dt
      while (acc >= 0.05) { step(b, 0.05); acc -= 0.05 }
      const t = nowMs / 1000
      consumeEvents(b, visual.current, t, hooks)
      drawBattle(ctx, b, visual.current, theme, t, real)
      hudT += real
      if (hudT > 0.1) { hudT = 0; setHud(snapshot(b)) }
      if ((b.phase === 'won' || b.phase === 'lost') && !finished.current) {
        endT += real
        if (endT > 1.3) { finished.current = true; setHud(snapshot(b)); finishBattle(b.phase === 'won', stage) }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); bgm.play('camp') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stage) return null
  const b = battle.current

  return (
    <div className="absolute inset-0 bg-black">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />

      {/* 좌상단: 일시정지 + 카운터 */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <button onClick={() => { paused.current = !paused.current; setUiPaused(paused.current) }} className="pq-btn pq-red h-12 w-12 text-2xl">{uiPaused ? '▶' : 'Ⅱ'}</button>
        <span className="hud-bar rounded-lg px-3 py-1 text-lg">⚔️ {hud?.kills ?? 0}</span>
        <span className="hud-bar rounded-lg px-3 py-1 text-lg">⏱ {fmt(hud?.time ?? 0)}</span>
        <span className="hud-bar max-w-[260px] truncate rounded-lg px-3 py-1 text-base text-yellow-200">{stage.name}</span>
      </div>
      {/* 우상단: 웨이브 진행 */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {Array.from({ length: hud?.waves ?? 0 }, (_, i) => (
          <span key={i} className={`h-7 w-7 rounded border-2 border-black/50 ${i + 1 < (hud?.wave ?? 0) || hud?.phase === 'won' ? 'bg-yellow-300' : i + 1 === hud?.wave ? 'bg-orange-400 blink' : 'bg-black/40'}`} />
        ))}
      </div>

      {/* 좌하단: 배속/자동 */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2">
        <Btn color="yellow" onClick={() => { speed.current = speed.current === 1 ? 2 : speed.current === 2 ? 3 : 1; setUiSpeed(speed.current) }} className="h-[52px] w-[96px] px-0 py-0 text-xl">×{uiSpeed}</Btn>
        <Btn color={auto ? 'green' : 'gray'} onClick={() => { const v = !auto; setAuto(v); if (b) b.auto = v }} className="h-[52px] w-[96px] px-0 py-0 text-sm">자동 {auto ? 'ON' : 'OFF'}</Btn>
      </div>
      {/* 우하단: 포기 */}
      <div className="absolute bottom-3 right-3">
        <Btn color="yellow" onClick={() => setQuit(true)} className="h-[52px] w-[96px] px-0 py-0 text-base">포기</Btn>
      </div>

      {/* 하단 중앙: 빨강/초록/파랑 포켓몬 바 */}
      <div className="pointer-events-none absolute bottom-3 flex gap-2" style={{ left: 112, right: 112 }}>
        {hud?.allies.map(a => {
          const ready = a.cd <= 0 && a.alive && hud.phase === 'fight'
          const hpr = a.hp / a.maxHp
          return (
            <div key={a.uid} className={`pointer-events-auto flex h-[92px] min-w-0 flex-1 items-center gap-1.5 rounded-2xl border-4 border-black/35 px-1.5 ${a.alive ? '' : 'grayscale'}`} style={{ background: SLOT_COLORS[a.slot % 3] }}>
              <Portrait id={a.id} size={54} />
              <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 1px 0 #0008' }}>
                <div className="truncate text-sm font-bold">{a.name} <span className="text-xs">Lv{a.level}</span></div>
                <div className="mt-1 h-3 overflow-hidden rounded border-2 border-black/50 bg-black/40"><div className="h-full" style={{ width: `${hpr * 100}%`, background: hpr > 0.5 ? '#46d2ff' : hpr > 0.2 ? '#f5d02e' : '#ff5a4a' }} /></div>
                <div className="mt-0.5 text-xs">{Math.ceil(a.hp)}/{a.maxHp}</div>
              </div>
              <button
                disabled={!ready}
                onClick={() => { if (b && useSpecial(b, a.uid)) setHud(snapshot(b)) }}
                className={`pq-btn relative h-[68px] w-[68px] shrink-0 overflow-hidden px-0.5 text-sm ${ready ? 'blink' : ''}`}
                style={{ background: ready ? TYPE_COLOR[a.type as keyof typeof TYPE_COLOR] : '#556' }}
              >
                <span className="block text-2xl leading-none">★</span>
                <span className="block text-xs leading-tight">{!a.alive ? '기절' : ready ? a.move : a.cd > 0 ? `${Math.ceil(a.cd)}초` : '…'}</span>
                {a.alive && !ready && <span className="absolute inset-x-0 bottom-0 bg-yellow-300" style={{ height: 6, width: `${(1 - a.cd / a.max) * 100}%` }} />}
              </button>
            </div>
          )
        })}
      </div>

      {quit && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="pq-panel pop-in w-[480px] p-6 text-center text-xl">
            탐험을 포기하고 캠프로 돌아갈까요?
            <div className="mt-5 flex justify-center gap-4">
              <Btn color="green" onClick={() => setQuit(false)}>계속하기</Btn>
              <Btn color="red" onClick={() => { finished.current = true; go('camp') }}>포기</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
