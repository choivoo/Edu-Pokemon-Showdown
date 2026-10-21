import { useEffect, useState } from 'react'
import { useGame } from '../store/gameStore'
import { AREAS, getEndlessStage, getStage, STAGES_PER_AREA } from '../lib/stages'
import { INGREDIENTS } from '../lib/cooking'
import { getSpecies } from '../lib/roster'
import { stoneName, SHAPES, STONE_INFO } from '../lib/stones'
import Dialog from '../components/Dialog'
import { bgm, sfx } from '../lib/sound'
import { useBattery } from '../ui/BatteryMeter'
import { MOVE_STONE_INFO } from '../lib/moveStones'
import { fieldScene } from '../lib/storyCampaign'
import { Btn, Panel, Portrait } from '../ui/kit'
import Icon, { Coins } from '../ui/Icon'

export default function Result() {
  const { result: r, save, go, startStage, markStory } = useGame()
  const [storyMode, setStoryMode] = useState<'field' | 'outro' | null>(() => r?.win && r.firstClear && r.stage.area >= 0 ? 'field' : r?.outroArea != null ? 'outro' : null)
  const bat = useBattery()

  useEffect(() => {
    if (!r) return
    if (r.win) { sfx.win(); if (r.levelUps.length) setTimeout(() => sfx.levelup(), 700) } else sfx.lose()
    bgm.play('camp')
  }, [r])

  if (!r) return null
  const { stage } = r
  const field = stage.area >= 0 ? fieldScene(stage.area, stage.index) : undefined
  const camp = () => go('camp')

  let next: (() => void) | null = null
  let nextStarts = true
  if (r.win) {
    if (stage.area >= 0) {
      const ni = stage.index + 1
      if (ni < STAGES_PER_AREA) next = () => startStage(getStage(stage.area, ni))
      else { next = () => go('island'); nextStarts = false }
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
            {!r.win && <p className="text-base">팀 레벨을 올리거나 P스톤을 배치하고 다시 도전해 보세요!</p>}
          </div>
          <div className="pq-inner flex-1 space-y-2 p-4 text-xl">
            {r.win && r.rewards ? (<>
              <div className="flex justify-between"><span>코인</span><b><Coins n={`+${r.rewards.coins}`} /></b></div>
              <div className="flex justify-between"><span>경험치 (파티 전원)</span><b>+{r.rewards.exp}</b></div>
              <div className="flex justify-between"><span>재료</span><span className="flex flex-wrap justify-end gap-2">{INGREDIENTS.filter(i => r.rewards!.ingredients[i.id]).map(i => <span key={i.id} className="inline-flex items-center"><Icon n={i.icon} s={28} />×{r.rewards!.ingredients[i.id]}</span>)}</span></div>
              {r.stone && <div className="flex justify-between"><span>파워스톤</span><b className="flex items-center gap-1" style={{ color: STONE_INFO[r.stone.kind].color }}><Icon n={STONE_INFO[r.stone.kind].icon} s={26} />{stoneName(r.stone)} ({SHAPES[r.stone.shape].length}칸)</b></div>}
              {r.moveStone && <div className="flex justify-between"><span>기술스톤</span><b className="flex items-center gap-1" style={{ color: MOVE_STONE_INFO[r.moveStone.kind].color }}><Icon n={MOVE_STONE_INFO[r.moveStone.kind].icon} s={26} />{MOVE_STONE_INFO[r.moveStone.kind].name}</b></div>}
              {r.levelUps.map(l => <p key={l.name} className="flex items-center gap-1 text-lg text-[#2e8f4a]"><Icon n="up" s={22} />{l.name} Lv{l.from} 에서 Lv{l.to}</p>)}
            </>) : <p className="text-center text-lg">아쉽지만 보상은 없어요.</p>}
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <Btn color="gray" onClick={camp}>캠프로</Btn>
          {bat.n <= 0 && <span className="mr-auto flex items-center gap-1 self-center text-base text-[#d23c36]"><Icon n="batteryEmpty" s={22} />배터리가 없어요. 충전되길 기다리거나 상점에서 충전하세요.</span>}
          <Btn color="blue" disabled={bat.n <= 0} onClick={() => startStage(stage)}>{r.win ? '다시' : '재도전'}</Btn>
          {next && <Btn color="green" onClick={next} disabled={nextStarts && bat.n <= 0} className="flex items-center gap-2">다음<Icon n="next" s={22} /></Btn>}
        </div>
      </Panel>
      {storyMode === 'field' && field && <Dialog key={field.id} lines={field.lines} name={save.name} onDone={() => { markStory(field.id); setStoryMode(r.outroArea != null ? 'outro' : null) }} />}
      {storyMode === 'outro' && r.outroArea != null && <Dialog key={'outro-' + r.outroArea} lines={AREAS[r.outroArea].outro} name={save.name} onDone={() => { markStory('outro-' + r.outroArea); setStoryMode(null) }} />}
    </div>
  )
}
