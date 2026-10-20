import { useState } from 'react'
import { areaUnlocked, useGame } from '../store/gameStore'
import { AREAS, getEndlessStage, getStage, STAGES_PER_AREA } from '../lib/stages'
import { INGREDIENTS } from '../lib/cooking'
import { STONE_INFO } from '../lib/stats'
import { getSpecies } from '../lib/roster'
import { frontSprite } from '../data/sprites'
import Dialog from '../components/Dialog'
import { bgm, sfx } from '../lib/sound'
import { useEffect } from 'react'

export default function Result() {
  const { result: r, save, go, setTab, startStage, markStory } = useGame()
  const [story, setStory] = useState(r?.outroArea != null)

  useEffect(() => {
    if (!r) return
    if (r.win) { sfx.win(); if (r.levelUps.length) setTimeout(() => sfx.levelup(), 700) } else sfx.lose()
    bgm.play('camp')
  }, [r])

  if (!r) return null
  const { stage } = r
  const home = () => { setTab('map'); go('home') }

  let next: (() => void) | null = null
  if (r.win) {
    if (stage.area >= 0) {
      const ni = stage.index + 1
      if (ni < STAGES_PER_AREA) next = () => startStage(getStage(stage.area, ni))
      else if (stage.area + 1 < AREAS.length && areaUnlocked(save, stage.area + 1)) next = home
    } else next = () => startStage(getEndlessStage(stage.endlessFloor! + 1))
  }

  const area = r.outroArea
  return (
    <div className="relative h-full">
      <div className="flex h-full flex-col items-center gap-3 overflow-y-auto p-5 text-center">
        <h2 className={`font-title mt-3 text-2xl ${r.win ? 'text-yellow-300' : 'text-red-400'}`}>{r.win ? 'CLEAR!' : 'FAILED...'}</h2>
        <p className="text-sm">{stage.name}</p>

        {r.win && r.rewards && (
          <div className="pixel-box w-full space-y-2 p-4 text-left text-sm">
            <Row k="코인" v={`+${r.rewards.coins} 🪙`} />
            <Row k="경험치 (파티 전원)" v={`+${r.rewards.exp} EXP`} />
            <div>
              <p className="text-gray-300">재료</p>
              <p className="mt-1 flex flex-wrap gap-2">
                {INGREDIENTS.filter(i => r.rewards!.ingredients[i.id]).map(i => <span key={i.id}>{i.emoji}×{r.rewards!.ingredients[i.id]}</span>)}
              </p>
            </div>
            {r.stone && <Row k="파워스톤" v={`${STONE_INFO[r.stone.kind].emoji} ${STONE_INFO[r.stone.kind].name} ${'★'.repeat(r.stone.star)}`} />}
            {r.levelUps.map(l => <p key={l.name} className="text-green-300">⬆ {l.name} Lv{l.from} → Lv{l.to}</p>)}
          </div>
        )}
        {r.recruited && (
          <div className="pixel-box flex w-full items-center gap-3 p-3 text-left">
            <img src={frontSprite(r.recruited.species)} alt="" className="sprite idle h-16 w-16" />
            <div>
              <p className="text-xs text-yellow-300">새 동료가 합류했어요!</p>
              <p className="text-base">{getSpecies(r.recruited.species).name} Lv{r.recruited.level}</p>
            </div>
          </div>
        )}
        {!r.win && <p className="text-xs text-gray-300">팀 레벨을 올리거나 파워스톤·타입 상성을 살펴보고 다시 도전해 보세요!</p>}

        <div className="mt-auto flex w-full gap-2">
          <button onClick={home} className="pixel-btn pixel-box flex-1 py-3">캠프로</button>
          <button onClick={() => startStage(stage)} className="pixel-btn pixel-box flex-1 py-3">{r.win ? '다시' : '재도전'}</button>
          {next && <button onClick={next} className="pixel-btn pixel-box flex-1 bg-[#3d6b3d] py-3">다음 ▶</button>}
        </div>
      </div>
      {story && area != null && (
        <Dialog lines={AREAS[area].outro} name={save.name} onDone={() => { markStory(`outro-${area}`); setStory(false) }} />
      )}
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between"><span className="text-gray-300">{k}</span><span>{v}</span></div>
)
