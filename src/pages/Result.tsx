import { useEffect, useState } from 'react'
import { useGame } from '../store/gameStore'
import { AREAS, getEndlessStage, getStage, STAGES_PER_AREA } from '../lib/stages'
import { INGREDIENTS } from '../lib/cooking'
import { getSpecies } from '../lib/roster'
import { stoneName, SHAPES, STONE_INFO } from '../lib/stones'
import Dialog from '../components/Dialog'
import { bgm, sfx } from '../lib/sound'
import { Btn, Panel, Portrait } from '../ui/kit'

export default function Result() {
  const { result: r, save, go, startStage, markStory } = useGame()
  const [story, setStory] = useState(r?.outroArea != null)

  useEffect(() => {
    if (!r) return
    if (r.win) { sfx.win(); if (r.levelUps.length) setTimeout(() => sfx.levelup(), 700) } else sfx.lose()
    bgm.play('camp')
  }, [r])

  if (!r) return null
  const { stage } = r
  const camp = () => go('camp')

  let next: (() => void) | null = null
  if (r.win) {
    if (stage.area >= 0) {
      const ni = stage.index + 1
      if (ni < STAGES_PER_AREA) next = () => startStage(getStage(stage.area, ni))
      else next = () => go('island')
    } else next = () => startStage(getEndlessStage(stage.endlessFloor! + 1))
  }

  return (
    <div className="absolute inset-0 bg-[#2a5a2a]">
      <Panel title={r.win ? '탐험 결과 — 클리어!' : '탐험 결과 — 실패…'} w={860}>
        <div className="flex gap-4">
          <div className="flex w-[300px] flex-col items-center gap-3">
            <p className={`font-title text-4xl ${r.win ? 'text-[#e8860a]' : 'text-[#d23c36]'}`}>{r.win ? 'CLEAR!' : 'FAILED'}</p>
            <p className="text-xl">{stage.name}</p>
            {r.recruited && (
              <div className="pq-inner flex w-full items-center gap-3 p-3">
                <Portrait id={r.recruited.species} size={72} />
                <div><p className="text-sm text-[#c06a00]">새 동료가 합류!</p><p className="text-xl">{getSpecies(r.recruited.species).name}</p><p className="text-sm">Lv{r.recruited.level}</p></div>
              </div>
            )}
            {!r.win && <p className="text-base">팀 레벨을 올리거나 파워스톤을 배치하고 다시 도전해 보세요!</p>}
          </div>
          <div className="pq-inner flex-1 space-y-2 p-4 text-xl">
            {r.win && r.rewards ? (<>
              <div className="flex justify-between"><span>코인</span><b>+{r.rewards.coins} 🪙</b></div>
              <div className="flex justify-between"><span>경험치 (파티 전원)</span><b>+{r.rewards.exp}</b></div>
              <div className="flex justify-between"><span>재료</span><span className="flex flex-wrap justify-end gap-2">{INGREDIENTS.filter(i => r.rewards!.ingredients[i.id]).map(i => <span key={i.id}>{i.emoji}×{r.rewards!.ingredients[i.id]}</span>)}</span></div>
              {r.stone && <div className="flex justify-between"><span>파워스톤</span><b style={{ color: STONE_INFO[r.stone.kind].color }}>{STONE_INFO[r.stone.kind].emoji} {stoneName(r.stone)} ({SHAPES[r.stone.shape].length}칸)</b></div>}
              {r.levelUps.map(l => <p key={l.name} className="text-lg text-[#2e8f4a]">⬆ {l.name} Lv{l.from} → Lv{l.to}</p>)}
            </>) : <p className="text-center text-lg">아쉽지만 보상은 없어요.</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Btn color="gray" onClick={camp}>캠프로</Btn>
          <Btn color="blue" onClick={() => startStage(stage)}>{r.win ? '다시' : '재도전'}</Btn>
          {next && <Btn color="green" onClick={next}>다음 ▶</Btn>}
        </div>
      </Panel>
      {story && r.outroArea != null && <Dialog lines={AREAS[r.outroArea].outro} name={save.name} onDone={() => { markStory(`outro-${r.outroArea}`); setStory(false) }} />}
    </div>
  )
}
