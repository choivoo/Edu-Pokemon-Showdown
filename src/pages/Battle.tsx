import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { type AllyInput, type Battle as BattleState, createBattle, step, useSpecial } from '../engine/battle'
import { consumeEvents, drawBattle, H, newVisual, preload, W } from '../engine/render'
import { AREAS, buildWaves } from '../lib/stages'
import { computeStats, type Stone } from '../lib/stats'
import { getSpecies } from '../lib/roster'
import { bgm, sfx } from '../lib/sound'
import { frontSprite } from '../data/sprites'

interface Hud {
  wave: number
  waves: number
  phase: BattleState['phase']
  allies: { uid: number; id: number; name: string; hp: number; maxHp: number; cd: number; max: number; alive: boolean }[]
}

const snapshot = (b: BattleState): Hud => ({
  wave: Math.min(b.wave + 1, b.waves.length), waves: b.waves.length, phase: b.phase,
  allies: b.units.filter(u => u.side === 'ally').map(u => ({ uid: u.uid, id: u.speciesId, name: u.name, hp: u.hp, maxHp: u.maxHp, cd: u.spCd, max: u.spMax, alive: u.alive })),
})

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
  const [confirmQuit, setConfirmQuit] = useState(false)

  useEffect(() => {
    if (!stage) return
    const allies: AllyInput[] = save.party
      .map(id => save.owned.find(o => o.id === id))
      .filter((o): o is NonNullable<typeof o> => !!o)
      .map(o => {
        const sp = getSpecies(o.species)
        const stones = o.stones.map(sid => save.stones.find(s => s.id === sid)).filter(Boolean) as Stone[]
        return { ownedId: o.id, speciesId: o.species, level: o.level, stats: computeStats(sp, o.level, stones) }
      })
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
      // 안정적인 시뮬레이션을 위해 고정 간격으로 쪼개서 진행
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
    <div className="flex h-full flex-col bg-[#1b1b2f]">
      <div className="flex items-center gap-2 border-b-4 border-black px-2 py-1.5 text-[11px]">
        <span className="min-w-0 flex-1 truncate text-yellow-300">{stage.name}</span>
        <span>{hud ? `WAVE ${hud.wave}/${hud.waves}` : ''}</span>
        <button onClick={() => { speed.current = speed.current === 1 ? 2 : speed.current === 2 ? 3 : 1; setUiSpeed(speed.current) }} className="pixel-btn rounded border-2 border-white px-1.5">×{uiSpeed}</button>
        <button onClick={() => { paused.current = !paused.current; setUiPaused(paused.current) }} className="pixel-btn rounded border-2 border-white px-1.5">{uiPaused ? '▶' : 'Ⅱ'}</button>
      </div>

      <canvas ref={canvas} width={W} height={H} className="w-full bg-black" style={{ imageRendering: 'pixelated', aspectRatio: `${W}/${H}` }} />

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {hud?.allies.map(a => {
            const ready = a.cd <= 0 && a.alive && hud.phase === 'fight'
            const hpr = a.hp / a.maxHp
            return (
              <button
                key={a.uid} disabled={!ready}
                onClick={() => { if (b && useSpecial(b, a.uid)) setHud(snapshot(b)) }}
                className={`pixel-btn relative overflow-hidden rounded border-4 p-1 text-center text-[10px] ${ready ? 'border-yellow-300 bg-[#4a4a7a]' : 'border-[#555577] bg-[#2b2b45]'} ${a.alive ? '' : 'grayscale'}`}
              >
                <img src={frontSprite(a.id)} alt="" className="sprite mx-auto h-12 w-12" />
                <div>{a.name}</div>
                <div className="mx-auto mt-0.5 h-2 w-full border border-black bg-gray-700">
                  <div className="h-full" style={{ width: `${hpr * 100}%`, background: hpr > 0.5 ? '#3ddc5a' : hpr > 0.2 ? '#f5d02e' : '#ee3b3b' }} />
                </div>
                <div className="mt-0.5 text-yellow-200">{!a.alive ? '기절' : ready ? '★ 필살기!' : `${Math.ceil(a.cd)}초`}</div>
                {a.alive && !ready && <div className="absolute inset-x-0 bottom-0 h-1 bg-yellow-300" style={{ width: `${(1 - a.cd / a.max) * 100}%` }} />}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <button onClick={() => { const v = !auto; setAuto(v); if (b) b.auto = v }} className={`pixel-btn rounded border-2 px-2 py-1 ${auto ? 'border-green-300 text-green-300' : 'border-gray-500 text-gray-300'}`}>
            자동 필살기 {auto ? 'ON' : 'OFF'}
          </button>
          <span className="flex-1 text-right text-gray-400">★ 표시가 뜨면 포켓몬을 탭!</span>
          <button onClick={() => setConfirmQuit(true)} className="pixel-btn text-gray-400 underline">포기</button>
        </div>
      </div>

      {confirmQuit && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-6">
          <div className="pixel-box w-full max-w-[300px] p-4 text-center text-sm">
            탐험을 포기하고 베이스캠프로 돌아갈까요?
            <div className="mt-3 flex gap-2">
              <button onClick={() => setConfirmQuit(false)} className="pixel-btn pixel-box flex-1 py-2">계속하기</button>
              <button onClick={() => { finished.current = true; go('home') }} className="pixel-btn pixel-box flex-1 bg-[#b03a2e] py-2">포기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
