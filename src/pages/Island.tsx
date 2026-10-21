import { useEffect, useRef, useState } from 'react'
import { allCleared, areaCleared, areaUnlocked, isCleared, legacyFanProgress, useGame } from '../store/gameStore'
import TypeBadge from '../components/TypeBadge'
import { AREA_BONUS, AREA_BONUS_MUL, AREAS, getEndlessStage, getStage, recommendedPower, stageCount, type Stage } from '../lib/stages'
import { getIngredient } from '../lib/cooking'
import { partyMons, partyPower } from '../lib/party'
import { getSpecies } from '../lib/roster'
import { useCanvas } from '../components/useCanvas'
import { AREA_NODES, drawIsland, ENDLESS_NODE } from '../art/scenes'
import { ORIGINAL_NODES, drawOriginalIsland } from '../art/originalIsland'
import { FAN_AREA_COUNT, ORIGINAL_FIRST, HAPPENSTANCE_AREA } from '../lib/originalCampaign'
import { H, W } from '../engine/draw'
import Dialog from '../components/Dialog'
import { Btn, PARTY_COLORS, Panel, Portrait } from '../ui/kit'
import Icon, { Coins } from '../ui/Icon'
import BatteryMeter, { useBattery } from '../ui/BatteryMeter'
import { bgm, sfx } from '../lib/sound'

export default function Island() {
  const { save, go, startStage, markStory, openPanel } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => { bgm.play('map','expeditions') }, [])
  const [area, setArea] = useState<number | null>(null)
  const [story, setStory] = useState<number | null>(null)
  const [mode, setMode] = useState<'original' | 'fan'>(() => legacyFanProgress(save) ? 'fan' : 'original')
  const unlocked = AREAS.map((_, i) => areaUnlocked(save, i))
  const endless = allCleared(save)
  const fanAvailable = endless || legacyFanProgress(save)
  useCanvas(canvas, (ctx, t) => {
    if (mode === 'original') drawOriginalIsland(ctx, t, unlocked.slice(ORIGINAL_FIRST, HAPPENSTANCE_AREA + 1), AREAS.slice(ORIGINAL_FIRST, HAPPENSTANCE_AREA + 1).map((_, i) => areaCleared(save, ORIGINAL_FIRST + i)))
    else drawIsland(ctx, t, unlocked.slice(0, FAN_AREA_COUNT), endless)
  }, [unlocked.join(), Object.keys(save.cleared).join(','), endless, mode])

  const mine = partyPower(save)
  const nextStage = (a: number) => Array.from({ length: stageCount(a) }, (_, i) => i).find(i => !isCleared(save, a, i)) ?? stageCount(a) - 1

  const open = (a: number) => {
    sfx.select()
    setArea(a)
    if (!save.seenStory.includes(`intro-${a}`)) setStory(a)
  }

  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />
      <div className="absolute left-3 top-3 flex items-center gap-3">
        <span className="pq-title border-4 border-[#7a4200] px-6 py-2 text-xl">섬 탐험</span>
        <span className="hud-bar flex items-center gap-2 px-4 py-2 text-base"><Icon n="sword" s={22} />내 파티 전투력 <b className="text-yellow-300">{mine}</b></span>
        <span className="hud-bar px-3 py-1.5"><BatteryMeter compact /></span>
      </div>

      <div className="absolute left-3 top-[80px] flex gap-2">
        <Btn color={mode === 'original' ? 'yellow' : 'gray'} onClick={() => { setArea(null); setStory(null); setMode('original') }} className="px-4 py-1 text-base">본편 · 네모루루섬</Btn>
        <Btn color={mode === 'fan' ? 'yellow' : 'gray'} disabled={!fanAvailable} onClick={() => { setArea(null); setStory(null); setMode('fan') }} className="px-4 py-1 text-base">{fanAvailable ? '추가 스토리 · 별모래섬' : '추가 스토리 · 엔딩 후 개방'}</Btn>
      </div>

      {AREAS.map((a, i) => {
        if (mode === 'original' ? i < ORIGINAL_FIRST : i >= FAN_AREA_COUNT) return null
        const n = mode === 'original' ? ORIGINAL_NODES[i - ORIGINAL_FIRST] : AREA_NODES[i]
        const ok = unlocked[i]
        const st = getStage(i, nextStage(i))
        const rec = recommendedPower(st)
        const done = Array.from({ length: stageCount(i) }, (_, k) => isCleared(save, i, k)).filter(Boolean).length
        return (
          <button key={a.name} disabled={!ok} onClick={() => open(i)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: n.x, top: n.y - 8 }}>
            <span className={`pop-in flex flex-col items-center border-4 border-[#2b2838] ${mode === 'original' ? 'max-w-[148px] px-2 py-0.5' : 'px-4 py-1'} shadow-[0_5px_0_#2b2838] ${ok ? (areaCleared(save, i) ? 'bg-[#58cf7c]' : 'bg-[#2f9f55]') : 'bg-gray-500'}`}>
              <Icon n={ok ? a.icon : 'lock'} s={mode === 'original' ? 26 : 40} />
              <span className={`${mode === 'original' ? 'text-sm' : 'text-base'} font-bold whitespace-nowrap`} style={{ textShadow: '2px 2px 0 #0006' }}>{a.name}</span>
              {ok && <span className={`flex items-center gap-1 text-lg font-bold ${mine >= rec ? 'text-white' : 'text-red-200'}`} style={{ textShadow: '2px 2px 0 #0007' }}><Icon n="sword" s={20} />{rec}</span>}
              {ok && <span className="text-xs text-yellow-100">{done}/{stageCount(i)}</span>}
            </span>
          </button>
        )
      })}

      {areaCleared(save, FAN_AREA_COUNT - 1) && mode === 'fan' && (
        <button onClick={() => { sfx.select(); startStage(getEndlessStage(save.endlessBest + 1)) }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: ENDLESS_NODE.x, top: ENDLESS_NODE.y - 8 }}>
          <span className="flex flex-col items-center border-4 border-[#2b2838] bg-[#7a4fe0] px-4 py-1 shadow-[0_5px_0_#2b2838]">
            <Icon n="star" s={36} /><span className="text-base font-bold">끝없는 별길</span>
            <span className="text-sm text-yellow-200">{save.endlessBest + 1}층 도전</span>
          </span>
        </button>
      )}

      {/* 하단: 파티 + 돌아가기 */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3">
        <button onClick={() => openPanel('team')} className="flex gap-1">
          {[0, 1, 2].map(i => {
            const m = partyMons(save)[i]
            return <span key={i} className="flex h-[70px] w-[150px] items-center gap-2 border-4 border-[#2b2838] px-2" style={{ background: PARTY_COLORS[i] }}>{m && (<><Portrait id={m.species} size={48} /><span className="whitespace-nowrap text-xs text-white">{getSpecies(m.species).name}<br /><b className="text-sm">Lv{m.level}</b></span></>)}</span>
          })}
        </button>
        <Btn color="red" onClick={() => go('camp')} className="flex h-[70px] w-[130px] items-center justify-center gap-2 text-xl"><Icon n="back" s={24} />캠프</Btn>
      </div>

      {area !== null && story === null && <StagePanel key={area} area={area} onClose={() => setArea(null)} onGo={s => { startStage(s) }} />}
      {story !== null && <Dialog lines={AREAS[story].intro} name={save.name} onDone={() => { markStory(`intro-${story}`); setStory(null) }} />}
    </div>
  )
}

function StagePanel({ area, onClose, onGo }: { area: number; onClose: () => void; onGo: (s: Stage) => void }) {
  const { save } = useGame()
  const a = AREAS[area]
  const mine = partyPower(save)
  const firstOpen = Array.from({ length: stageCount(area) }, (_, i) => i).find(i => !isCleared(save, area, i)) ?? stageCount(area) - 1
  const [sel, setSel] = useState(firstOpen)
  const st = getStage(area, sel)
  const rec = recommendedPower(st)
  const party = partyMons(save).length
  const bat = useBattery()

  return (
    <Panel title={a.name} onClose={onClose} w={820}>
      <div className="flex gap-4">
        <div className="flex w-[380px] flex-col gap-2">
          {Array.from({ length: stageCount(area) }, (_, i) => {
            const s = getStage(area, i)
            const ok = area === HAPPENSTANCE_AREA || i === 0 || isCleared(save, area, i - 1)
            return (
              <button key={i} disabled={!ok} onClick={() => { sfx.select(); setSel(i) }} className={`flex items-center gap-3 border-4 px-3 py-2 text-left ${sel === i ? 'border-[#e8524a] bg-white' : 'border-[#c98a00] bg-[#fff3c8]'} ${ok ? '' : 'opacity-50'}`}>
                <span className="flex w-8 justify-center text-2xl">{s.boss ? <Icon n="crown" s={28} /> : i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-lg">{s.name}</span>
                <span className={`flex items-center gap-1 text-base font-bold ${mine >= recommendedPower(s) ? 'text-[#2e8f4a]' : 'text-[#d23c36]'}`}><Icon n="sword" s={18} />{recommendedPower(s)}</span>
                <span className="flex w-6 justify-center">{isCleared(save, area, i) ? <Icon n="check" s={22} /> : ok ? null : <Icon n="lock" s={20} />}</span>
              </button>
            )
          })}
        </div>
        <div className="pq-inner flex flex-1 flex-col gap-2 p-4 text-lg">
          <p className="text-2xl font-bold text-[#c06a00]">{st.name}</p>
          <p>적 Lv{st.level} · {st.wavePlan.length}웨이브{st.boss ? ' · 보스!' : ''}{st.timeLimitSec ? ' · 제한시간 5분' : ''}</p>
          <p>추천 전투력 <b className={mine >= rec ? 'text-[#2e8f4a]' : 'text-[#d23c36]'}>{rec}</b> <span className="text-base">(내 파티 {mine})</span></p>
          <p className="flex flex-wrap items-center gap-1">재료 {a.drops.map(d => <Icon key={d} n={getIngredient(d).icon} s={24} />)} <Coins n={st.coins} s={20} className="ml-2" /> <span className="ml-2">EXP {st.exp}</span></p>
          <p className="flex flex-wrap items-center gap-1 text-base">지역 보너스 타입 {AREA_BONUS[area].map(t => <TypeBadge key={t} type={t} />)} <span>체력·공격 ×{AREA_BONUS_MUL}</span></p>
          <p className="text-base">P스톤 {st.boss ? '확정' : '가끔'} 드롭{st.recruit ? ` · 첫 클리어 시 ${getSpecies(st.recruit).name} 합류!` : ''}</p>
          <p className="flex items-center gap-1 text-base"><Icon n="battery" s={20} />탐험하면 배터리 1개를 써요 (남은 {bat.n}개)</p>
          <Btn color="red" disabled={!party || bat.n <= 0} onClick={() => onGo(st)} className="mt-auto py-3 text-2xl">{bat.n <= 0 ? '배터리가 없어요' : '출발!'}</Btn>
        </div>
      </div>
    </Panel>
  )
}
