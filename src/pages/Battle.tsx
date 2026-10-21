import { useEffect, useRef, useState } from 'react'
import { useGame } from '../store/gameStore'
import { type AllyInput, type Battle as BattleState, createBattle, movePartyTo, scatter, step, useSpecial, waveCenter } from '../engine/battle'
import { consumeEvents, drawBattle, H, newVisual, preload, SLOT_COLORS, W } from '../engine/render'
import { AREAS, AREA_BONUS_MUL, buildWaves, hasAreaBonus, type Theme } from '../lib/stages'
import { HAPPENSTANCE_AREA } from '../lib/originalCampaign'
import { getSpecies } from '../lib/roster'
import { moveFxOf, partyMons, statsOf } from '../lib/party'
import { bgm, sfx } from '../lib/sound'
import { TYPE_COLOR } from '../lib/typeChart'
import { Btn, Portrait } from '../ui/kit'
import Icon from '../ui/Icon'

interface Hud {
  wave: number
  waves: number
  kills: number
  time: number
  phase: BattleState['phase']
  scatterLeft: number
  partyX: number
  partyY: number
  targetX: number
  targetY: number
  allies: { uid: number; id: number; name: string; level: number; hp: number; maxHp: number; cd: number; max: number; alive: boolean; slot: number; move: string; type: string; move2?: string; type2?: string; cd2?: number; max2?: number }[]
}

const snapshot = (b: BattleState): Hud => ({
  wave: Math.min(b.wave + 1, b.waves.length), waves: b.waves.length, kills: b.kills, time: b.t, phase: b.phase,
  scatterLeft: Math.max(0, b.scatterCd - b.t),
  partyX: b.units.filter(x => x.side==='ally' && x.alive).reduce((n,x)=>n+x.x,0)/Math.max(1,b.units.filter(x=>x.side==='ally'&&x.alive).length),
  partyY: b.units.filter(x => x.side==='ally' && x.alive).reduce((n,x)=>n+x.y,0)/Math.max(1,b.units.filter(x=>x.side==='ally'&&x.alive).length),
  targetX: waveCenter(Math.min(b.wave,b.waves.length-1),b.waves.length).x,
  targetY: waveCenter(Math.min(b.wave,b.waves.length-1),b.waves.length).y,
  allies: b.units.filter(u => u.side === 'ally').sort((a, c) => a.slot - c.slot).map(u => ({
    uid: u.uid, id: u.speciesId, name: u.name, level: u.level, hp: u.hp, maxHp: u.maxHp, cd: u.spCd, max: u.spMax, alive: u.alive, slot: u.slot, move: u.special.name, type: u.special.type, ...(u.secondary ? { move2: u.secondary.name, type2: u.secondary.type, cd2: u.spCd2, max2: u.spMax2 } : {}),
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
    const keymove=(e:KeyboardEvent)=>{
      if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return
      const d:Record<string,[number,number]>={
        ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],
        ArrowRight:[1,0],d:[1,0],D:[1,0],
        ArrowUp:[0,-1],w:[0,-1],W:[0,-1],
        ArrowDown:[0,1],s:[0,1],S:[0,1],
      }
      const v=d[e.key],b=battle.current
      if(!v||!b||paused.current)return
      e.preventDefault()
      const allies=b.units.filter(x=>x.side==='ally'&&x.alive)
      if(!allies.length)return
      const x=allies.reduce((n,x)=>n+x.x,0)/allies.length
      const y=allies.reduce((n,x)=>n+x.y,0)/allies.length
      movePartyTo(b,(b.manualPoint?.x??x)+v[0]*165,(b.manualPoint?.y??y)+v[1]*165)
    }
    window.addEventListener('keydown',keymove)
    return()=>window.removeEventListener('keydown',keymove)
  },[])

  useEffect(() => {
    if (!stage) return
    const allies: AllyInput[] = partyMons(save).map(o => {
      let stats = statsOf(save, o)
      // 지역 보너스 타입은 그 지역에서 더 강하다
      if (hasAreaBonus(stage.area, getSpecies(o.species).types)) stats = { ...stats, maxHp: Math.round(stats.maxHp * AREA_BONUS_MUL), atk: Math.round(stats.atk * AREA_BONUS_MUL) }
      return { ownedId: o.id, speciesId: o.species, level: o.level, stats, fx: moveFxOf(save, o, 0), fx2: moveFxOf(save,o,1), move: o.move, move2: o.move2 }
    })
    const waves = buildWaves(stage)
    preload([...allies.map(a => a.speciesId), ...waves.flat().map(w => w.species)])
    const b = createBattle(allies, waves, Math.random, stage)
    battle.current = b
    setHud(snapshot(b))
    const regionMusic = (['tide', 'grove', 'echo', 'spark', 'ember', 'astral'] as const)[stage.area] ?? 'battle'
    bgm.play(stage.boss ? 'boss' : regionMusic)
    if (stage.boss && stage.area >= 0) sfx.cry(waves.flat().find(w => w.boss)?.species ?? AREAS[stage.area].boss)

    const ctx = canvas.current!.getContext('2d')!
    const themes: Theme[] = ['beach', 'forest', 'cave', 'gorge', 'volcano', 'altar']
    const theme = stage.area === HAPPENSTANCE_AREA ? (stage.index === 8 ? 'altar' : themes[Math.floor(Math.random() * themes.length)]) : stage.area >= 0 ? AREAS[stage.area].theme : themes[stage.index % 6]
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
      bossDefeated: () => { sfx.bossFinale() },
    }
    const loop = (nowMs: number) => {
      const real = Math.min(0.1, (nowMs - last) / 1000)
      last = nowMs
      const dt = paused.current ? 0 : real * speed.current
      acc += dt
      while (acc >= 0.05) {
        step(b, 0.05)
        acc -= 0.05
        if (stage.timeLimitSec && b.t >= stage.timeLimitSec && b.phase !== 'won') {
          b.phase = 'lost'
          b.events.push({ k: 'banner', text: '탐험 제한시간 종료!', tone: 'warn' })
          acc = 0
          break
        }
      }
      const t = nowMs / 1000
      consumeEvents(b, visual.current, t, hooks)
      drawBattle(ctx, b, visual.current, theme, t, real)
      hudT += real
      if (hudT > 0.1) { hudT = 0; setHud(snapshot(b)) }
      if ((b.phase === 'won' || b.phase === 'lost') && !finished.current) {
        endT += real
        if (endT > (stage.area===6 && [0,1,3].includes(stage.index) ? 2.45 : 1.3)) { finished.current = true; setHud(snapshot(b)); finishBattle(b.phase === 'won', stage, b.kills) }
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
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full cursor-crosshair"
        onPointerDown={e=>{
          if(paused.current||!battle.current)return
          const box=e.currentTarget.getBoundingClientRect()
          const sx=(e.clientX-box.left)/box.width*W
          const sy=(e.clientY-box.top)/box.height*H
          movePartyTo(battle.current,visual.current.cameraX+sx-W/2,visual.current.cameraY+sy-H/2)
        }} />

      {/* 좌상단: 일시정지 + 카운터 */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <button onClick={() => { paused.current = !paused.current; setUiPaused(paused.current) }} className="pq-btn pq-red flex h-12 w-12 items-center justify-center"><Icon n={uiPaused ? 'play' : 'pause'} s={30} /></button>
        <span className="hud-bar flex items-center gap-1 px-3 py-1 text-lg"><Icon n="sword" s={22} />{hud?.kills ?? 0}</span>
        <span className={`hud-bar flex items-center gap-1 px-3 py-1 text-lg ${stage.timeLimitSec && (stage.timeLimitSec - (hud?.time ?? 0)) <= 30 ? 'text-red-300 blink' : ''}`}><Icon n="clock" s={22} />{stage.timeLimitSec ? fmt(Math.max(0, stage.timeLimitSec - (hud?.time ?? 0))) : fmt(hud?.time ?? 0)}</span>
        <span className="hud-bar max-w-[260px] truncate px-3 py-1 text-base text-yellow-200">{stage.name}</span>
      </div>
      {/* 우상단: 웨이브 진행 */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {Array.from({ length: hud?.waves ?? 0 }, (_, i) => (
          <span key={i} className={`h-7 w-7 border-4 border-[#2b2838] ${i + 1 < (hud?.wave ?? 0) || hud?.phase === 'won' ? 'bg-yellow-300' : i + 1 === hud?.wave ? 'bg-orange-400 blink' : 'bg-black/40'}`} />
        ))}
      </div>

      {/* 2.5D 광역 필드의 현 위치 및 다음 교전 지점 */}
      {hud && <div className="absolute right-3 top-12 z-10 w-[152px] border-[3px] border-[#604e32] bg-[#d4edb6]/95 p-1 shadow-[3px_4px_0_#392a1b]">
        <div className="mb-0.5 text-center text-[10px] font-black text-[#486146]">섬 탐험 · 터치 / WASD 이동</div>
        <div className="relative h-[66px] overflow-hidden border-2 border-[#85b27c] bg-[repeating-linear-gradient(40deg,#afdc9e_0px,#afdc9e_12px,#a2d493_12px,#a2d493_24px)] cursor-crosshair" title="미니맵 터치로 목적지 지정" onPointerDown={e=>{
            const box=e.currentTarget.getBoundingClientRect()
            if(battle.current)movePartyTo(battle.current,(e.clientX-box.left)/box.width*3220,(e.clientY-box.top)/box.height*1460)
          }}>
          <span className="absolute h-2.5 w-2.5 rounded-sm border border-white bg-red-500 shadow" style={{left:`${hud.targetX/3220*100}%`,top:`${hud.targetY/1460*100}%`}} title="이번 웨이브 전투 지역" />
          <span className="absolute h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-600 shadow" style={{left:`${hud.partyX/3220*100}%`,top:`${hud.partyY/1460*100}%`}} title="우리 포켓몬 위치" />
          <span className="absolute bottom-0 right-1 text-[9px] text-[#426744]">● 팀  ■ 적</span>
        </div>
      </div>}
      {/* 좌하단: 배속/자동 */}
      <div className="absolute bottom-3 left-3 flex flex-col gap-2">
        <Btn color="yellow" onClick={() => { speed.current = speed.current === 1 ? 2 : speed.current === 2 ? 3 : 1; setUiSpeed(speed.current) }} className="h-[52px] w-[96px] px-0 py-0 text-xl">×{uiSpeed}</Btn>
        <Btn color={auto ? 'green' : 'gray'} onClick={() => { const v = !auto; setAuto(v); if (b) b.auto = v }} className="h-[52px] w-[96px] px-0 py-0 text-sm">자동 {auto ? 'ON' : 'OFF'}</Btn>
      </div>
      {/* 우하단: 흩어지기 / 포기 */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-2">
        <Btn color={hud && hud.scatterLeft <= 0 ? 'blue' : 'gray'} onClick={() => { if (b && scatter(b)) { sfx.step(); setHud(snapshot(b)) } }} className="h-[52px] w-[96px] px-0 py-0 text-sm">
          {hud && hud.scatterLeft > 0 ? `흩어지기 ${Math.ceil(hud.scatterLeft)}` : '흩어지기'}
        </Btn>
        <Btn color="yellow" onClick={() => setQuit(true)} className="h-[52px] w-[96px] px-0 py-0 text-base">포기</Btn>
      </div>

      {/* 하단 중앙: 빨강/초록/파랑 포켓몬 바 */}
      <div className="pointer-events-none absolute bottom-3 flex gap-2" style={{ left: 112, right: 112 }}>
        {hud?.allies.map(a => {
          const hpr = a.hp / a.maxHp
          return (
            <div key={a.uid} className={`pointer-events-auto flex h-[92px] min-w-0 flex-1 items-center gap-1.5 border-4 border-[#2b2838] px-1.5 ${a.alive ? '' : 'grayscale'}`} style={{ background: SLOT_COLORS[a.slot % 3] }}>
              <Portrait id={a.id} size={54} />
              <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 1px 0 #0008' }}>
                <div className="truncate text-sm font-bold">{a.name} <span className="text-xs">Lv{a.level}</span></div>
                <div className="mt-1 h-3 overflow-hidden border-2 border-[#2b2838] bg-black/40"><div className="h-full" style={{ width: `${hpr * 100}%`, background: hpr > 0.5 ? '#46d2ff' : hpr > 0.2 ? '#f5d02e' : '#ff5a4a' }} /></div>
                <div className="mt-0.5 text-xs">{Math.ceil(a.hp)}/{a.maxHp}</div>
              </div>
              <div className="flex shrink-0 gap-1">
                {([0, ...(a.move2 ? [1] : [])] as number[]).map(i => {
                  const cd = i ? a.cd2 ?? 0 : a.cd
                  const max = i ? a.max2 ?? 1 : a.max
                  const name = i ? a.move2 ?? a.move : a.move
                  const type = i ? a.type2 ?? a.type : a.type
                  const canUse = a.alive && hud.phase === 'fight' && cd <= 0
                  return (
                    <button key={i} disabled={!canUse}
                      onClick={() => { if (b && useSpecial(b, a.uid, i as 0 | 1)) setHud(snapshot(b)) }}
                      className={`pq-btn relative h-[68px] w-[62px] shrink-0 overflow-hidden px-0.5 text-xs ${canUse ? 'blink' : ''}`}
                      style={{ background: canUse ? TYPE_COLOR[type as keyof typeof TYPE_COLOR] : '#556' }}
                      title={name}>
                      <span className="flex justify-center"><Icon n="star" s={24} /></span>
                      <span className="block truncate text-xs leading-tight">{!a.alive ? '기절' : canUse ? name : cd > 0 ? Math.ceil(cd) + '초' : '…'}</span>
                      {a.alive && !canUse && <span className="absolute inset-x-0 bottom-0 bg-yellow-300" style={{ height: 6, width: `${(1 - cd / max) * 100}%` }} />}
                    </button>
                  )
                })}
              </div>
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
