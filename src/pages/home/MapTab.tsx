import { useState } from 'react'
import { allCleared, areaUnlocked, isCleared, useGame } from '../../store/gameStore'
import { AREAS, getEndlessStage, getStage, STAGES_PER_AREA, type Stage } from '../../lib/stages'
import { getIngredient } from '../../lib/cooking'
import Dialog from '../../components/Dialog'
import { sfx } from '../../lib/sound'

export default function MapTab() {
  const { save, startStage, setTab, markStory } = useGame()
  const [open, setOpen] = useState(() => {
    const first = AREAS.findIndex((_, i) => areaUnlocked(save, i) && !isCleared(save, i, 4))
    return first < 0 ? AREAS.length - 1 : first
  })
  const [sel, setSel] = useState<Stage | null>(null)
  const [story, setStory] = useState<number | null>(() => (save.seenStory.includes('intro-0') ? null : 0))

  const party = save.party.length

  const openArea = (i: number) => {
    sfx.select()
    setOpen(i)
    setSel(null)
    if (!save.seenStory.includes(`intro-${i}`)) setStory(i)
  }

  return (
    <div className="space-y-3 p-3">
      {AREAS.map((a, ai) => {
        const unlocked = areaUnlocked(save, ai)
        const isOpen = open === ai && unlocked
        const done = Array.from({ length: STAGES_PER_AREA }, (_, i) => isCleared(save, ai, i)).filter(Boolean).length
        return (
          <div key={a.name} className={`pixel-box overflow-hidden ${unlocked ? '' : 'opacity-50'}`}>
            <button disabled={!unlocked} onClick={() => (isOpen ? setOpen(-1) : openArea(ai))} className="flex w-full items-center gap-3 p-3 text-left">
              <span className="text-3xl">{unlocked ? a.emoji : '🔒'}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{ai + 1}. {a.name}</span>
                <span className="block text-[10px] text-gray-300">{unlocked ? `Lv${a.levelBase}~ · ${a.shard}` : `${AREAS[ai - 1].bossName}을(를) 쓰러뜨리면 열려요`}</span>
              </span>
              <span className="text-[11px] text-yellow-300">{done}/{STAGES_PER_AREA}</span>
            </button>
            {isOpen && (
              <div className="border-t-2 border-[#555577] p-3">
                <div className="flex justify-between gap-1">
                  {Array.from({ length: STAGES_PER_AREA }, (_, i) => {
                    const st = getStage(ai, i)
                    const ok = i === 0 || isCleared(save, ai, i - 1)
                    const cleared = isCleared(save, ai, i)
                    return (
                      <button
                        key={i} disabled={!ok} onClick={() => { sfx.select(); setSel(st) }}
                        className={`pixel-btn flex h-14 flex-1 flex-col items-center justify-center rounded border-4 text-[11px] ${sel?.id === st.id ? 'border-yellow-300' : 'border-[#555577]'} ${st.boss ? 'bg-[#6a2a3a]' : 'bg-[#2b2b45]'}`}
                      >
                        <span>{st.boss ? '👑' : i + 1}</span>
                        <span className="text-[9px] text-green-300">{cleared ? '✔' : ok ? '' : '🔒'}</span>
                      </button>
                    )
                  })}
                </div>
                {sel && sel.area === ai && <StageInfo stage={sel} />}
              </div>
            )}
          </div>
        )
      })}

      {allCleared(save) && (
        <div className="pixel-box space-y-2 p-3">
          <p className="text-sm text-yellow-300">🌠 끝없는 별길</p>
          <p className="text-[11px] text-gray-300">프리즘의 빛이 만든 끝없는 길. 최고 기록 {save.endlessBest}층 · 10층 클리어 시 전설의 동료가…?</p>
          <button disabled={!party} onClick={() => { sfx.select(); startStage(getEndlessStage(save.endlessBest + 1)) }} className="pixel-btn pixel-box w-full bg-[#4a2f8a] py-2">
            {save.endlessBest + 1}층 도전
          </button>
        </div>
      )}

      {!party && <p className="text-center text-xs text-red-300">파티가 비어 있어요. <button onClick={() => setTab('team')} className="underline">팀 탭</button>에서 편성하세요.</p>}

      {story !== null && (
        <Dialog lines={AREAS[story].intro} name={save.name} onDone={() => { markStory(`intro-${story}`); setStory(null) }} />
      )}
    </div>
  )

  function StageInfo({ stage }: { stage: Stage }) {
    const a = AREAS[stage.area]
    return (
      <div className="mt-3 space-y-2 rounded bg-[#1b1b2f] p-3 text-[12px]">
        <div className="flex justify-between">
          <span className="text-yellow-300">{stage.name}</span>
          <span>적 Lv{stage.level} · {stage.wavePlan.length}웨이브</span>
        </div>
        <p className="text-gray-300">드롭: {a.drops.map(d => getIngredient(d).emoji).join(' ')} + 파워스톤{stage.boss ? ' (확정)' : ' (가끔)'}</p>
        <p className="text-gray-300">보상: 🪙{stage.coins} · EXP {stage.exp}{stage.recruit ? ' · 첫 클리어 시 동료 합류!' : ''}</p>
        <button disabled={!party} onClick={() => startStage(stage)} className="pixel-btn pixel-box w-full bg-[#b03a2e] py-2.5 text-sm">출발!</button>
      </div>
    )
  }
}
