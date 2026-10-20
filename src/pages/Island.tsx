import { useRef, useState } from 'react'
import { allCleared, areaCleared, areaUnlocked, isCleared, useGame } from '../store/gameStore'
import { AREAS, getEndlessStage, getStage, recommendedPower, STAGES_PER_AREA, type Stage } from '../lib/stages'
import { getIngredient } from '../lib/cooking'
import { partyMons, partyPower } from '../lib/party'
import { getSpecies } from '../lib/roster'
import { useCanvas } from '../components/useCanvas'
import { AREA_NODES, drawIsland, ENDLESS_NODE } from '../engine/scenes'
import { H, W } from '../engine/draw'
import Dialog from '../components/Dialog'
import { Btn, PARTY_COLORS, Panel, Portrait } from '../ui/kit'
import { sfx } from '../lib/sound'

export default function Island() {
  const { save, go, startStage, markStory, openPanel } = useGame()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [area, setArea] = useState<number | null>(null)
  const [story, setStory] = useState<number | null>(null)
  const unlocked = AREAS.map((_, i) => areaUnlocked(save, i))
  const endless = allCleared(save)
  useCanvas(canvas, (ctx, t) => drawIsland(ctx, t, unlocked, endless), [unlocked.join(), endless])

  const mine = partyPower(save)
  const nextStage = (a: number) => Array.from({ length: STAGES_PER_AREA }, (_, i) => i).find(i => !isCleared(save, a, i)) ?? STAGES_PER_AREA - 1

  const open = (a: number) => {
    sfx.select()
    setArea(a)
    if (!save.seenStory.includes(`intro-${a}`)) setStory(a)
  }

  return (
    <div className="absolute inset-0">
      <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" />
      <div className="absolute left-3 top-3 flex items-center gap-3">
        <span className="pq-title rounded-xl px-6 py-2 text-xl shadow-[0_4px_0_#b86a00]">섬 탐험</span>
        <span className="hud-bar rounded-xl px-4 py-2 text-base">내 파티 전투력 <b className="text-yellow-300">{mine}</b></span>
      </div>

      {AREAS.map((a, i) => {
        const n = AREA_NODES[i]
        const ok = unlocked[i]
        const st = getStage(i, nextStage(i))
        const rec = recommendedPower(st)
        const done = Array.from({ length: STAGES_PER_AREA }, (_, k) => isCleared(save, i, k)).filter(Boolean).length
        return (
          <button key={a.name} disabled={!ok} onClick={() => open(i)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: n.x, top: n.y - 8 }}>
            <span className={`pop-in flex flex-col items-center rounded-xl border-4 px-4 py-1 shadow-[0_5px_0_rgba(0,0,0,0.35)] ${ok ? (areaCleared(save, i) ? 'border-[#2e9f55] bg-[#58cf7c]' : 'border-[#1f7a3c] bg-[#2f9f55]') : 'border-gray-600 bg-gray-500'}`}>
              <span className="text-3xl leading-none">{ok ? a.emoji : '🔒'}</span>
              <span className="text-base font-bold" style={{ textShadow: '0 2px 0 #0006' }}>{a.name}</span>
              {ok && <span className={`text-lg font-bold ${mine >= rec ? 'text-white' : 'text-red-200'}`} style={{ textShadow: '0 2px 0 #0007' }}>⚔️ {rec}</span>}
              {ok && <span className="text-xs text-yellow-100">{done}/{STAGES_PER_AREA}</span>}
            </span>
          </button>
        )
      })}

      {allCleared(save) && (
        <button onClick={() => { sfx.select(); startStage(getEndlessStage(save.endlessBest + 1)) }} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: ENDLESS_NODE.x, top: ENDLESS_NODE.y - 8 }}>
          <span className="flex flex-col items-center rounded-xl border-4 border-[#b89a2a] bg-[#7a4fe0] px-4 py-1 shadow-[0_5px_0_rgba(0,0,0,0.35)]">
            <span className="text-3xl">🌠</span><span className="text-base font-bold">끝없는 별길</span>
            <span className="text-sm text-yellow-200">{save.endlessBest + 1}층 도전</span>
          </span>
        </button>
      )}

      {/* 하단: 파티 + 돌아가기 */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-4 pb-3">
        <button onClick={() => openPanel('team')} className="flex gap-1">
          {[0, 1, 2].map(i => {
            const m = partyMons(save)[i]
            return <span key={i} className="flex h-[70px] w-[120px] items-center gap-2 rounded-xl border-4 border-black/30 px-2" style={{ background: PARTY_COLORS[i] }}>{m && (<><Portrait id={m.species} size={50} /><span className="text-sm text-white">{getSpecies(m.species).name}<br /><b>Lv{m.level}</b></span></>)}</span>
          })}
        </button>
        <Btn color="red" onClick={() => go('camp')} className="h-[70px] w-[130px] text-xl">↩ 캠프</Btn>
      </div>

      {area !== null && !story && <StagePanel area={area} onClose={() => setArea(null)} onGo={s => startStage(s)} />}
      {story !== null && <Dialog lines={AREAS[story].intro} name={save.name} onDone={() => { markStory(`intro-${story}`); setStory(null) }} />}
    </div>
  )
}

function StagePanel({ area, onClose, onGo }: { area: number; onClose: () => void; onGo: (s: Stage) => void }) {
  const { save } = useGame()
  const a = AREAS[area]
  const mine = partyPower(save)
  const firstOpen = Array.from({ length: STAGES_PER_AREA }, (_, i) => i).find(i => !isCleared(save, area, i)) ?? STAGES_PER_AREA - 1
  const [sel, setSel] = useState(firstOpen)
  const st = getStage(area, sel)
  const rec = recommendedPower(st)
  const party = partyMons(save).length

  return (
    <Panel title={`${a.emoji} ${a.name}`} onClose={onClose} w={820}>
      <div className="flex gap-4">
        <div className="flex w-[380px] flex-col gap-2">
          {Array.from({ length: STAGES_PER_AREA }, (_, i) => {
            const s = getStage(area, i)
            const ok = i === 0 || isCleared(save, area, i - 1)
            return (
              <button key={i} disabled={!ok} onClick={() => { sfx.select(); setSel(i) }} className={`flex items-center gap-3 rounded-xl border-4 px-3 py-2 text-left ${sel === i ? 'border-[#e8524a] bg-white' : 'border-[#e5a500] bg-[#fff3c8]'} ${ok ? '' : 'opacity-50'}`}>
                <span className="w-8 text-center text-2xl">{s.boss ? '👑' : i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-lg">{s.name}</span>
                <span className={`text-base font-bold ${mine >= recommendedPower(s) ? 'text-[#2e8f4a]' : 'text-[#d23c36]'}`}>⚔️{recommendedPower(s)}</span>
                <span className="w-6 text-xl text-[#2e8f4a]">{isCleared(save, area, i) ? '✔' : ok ? '' : '🔒'}</span>
              </button>
            )
          })}
        </div>
        <div className="pq-inner flex flex-1 flex-col gap-2 p-4 text-lg">
          <p className="text-2xl font-bold text-[#c06a00]">{st.name}</p>
          <p>적 Lv{st.level} · {st.wavePlan.length}웨이브{st.boss ? ' · 보스!' : ''}</p>
          <p>추천 전투력 <b className={mine >= rec ? 'text-[#2e8f4a]' : 'text-[#d23c36]'}>{rec}</b> <span className="text-base">(내 파티 {mine})</span></p>
          <p>재료 {a.drops.map(d => getIngredient(d).emoji).join(' ')} · 🪙{st.coins} · EXP {st.exp}</p>
          <p className="text-base">파워스톤 {st.boss ? '확정' : '가끔'} 드롭{st.recruit ? ` · 첫 클리어 시 ${getSpecies(st.recruit).name} 합류!` : ''}</p>
          <Btn color="red" disabled={!party} onClick={() => onGo(st)} className="mt-auto py-3 text-2xl">출발!</Btn>
        </div>
      </div>
    </Panel>
  )
}
