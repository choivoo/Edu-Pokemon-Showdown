import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { ALL_STORY_SCENES, EPILOGUE_SCENES, STORY_CHAPTERS, storyProgress, storyUnlocked, type StoryScene } from '../../lib/storyCampaign'
import Dialog from '../../components/Dialog'
import { Btn, Panel } from '../../ui/kit'
import Icon from '../../ui/Icon'

/** 탐험 결과에서 처음 본 장면뿐 아니라 보너스 기록도 다시 읽을 수 있는 모험일지. */
export default function StoryPanel() {
  const { save, openPanel } = useGame()
  const [chapter, setChapter] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [reading, setReading] = useState<StoryScene | null>(null)
  const ch = STORY_CHAPTERS[chapter]
  const episodes = chapter === STORY_CHAPTERS.length - 1 ? [...ch.scenes, ...EPILOGUE_SCENES] : ch.scenes
  const usable = episodes.filter(scene => storyUnlocked(save, scene))
  const active = episodes.find(scene => scene.id === selected && storyUnlocked(save, scene)) ?? usable[0]
  const progress = storyProgress(save)
  const chapterComplete = (n: number) => STORY_CHAPTERS[n].scenes.filter(s => storyUnlocked(save, s)).length

  return (
    <>
      <Panel title="모험일지 · 별모래섬의 기록" w={920} h={500} onClose={() => openPanel(null)}>
        <div className="mb-2 flex items-center justify-between gap-2 border-b-2 border-[#b99138] pb-2 text-sm">
          <span className="font-bold text-[#7b4c16]">기록된 이야기 {progress.unlocked}/{progress.total}장면</span>
          <span className="text-[#80632e]">탐험을 처음 클리어하면 새로운 이야기가 열립니다.</span>
        </div>
        <div className="flex h-[356px] gap-3">
          <div className="scroll-thin w-[215px] shrink-0 space-y-2 overflow-y-auto pr-1">
            {STORY_CHAPTERS.map((c, i) => {
              const obtained = chapterComplete(i)
              return (
                <button key={c.title} onClick={() => { setChapter(i); setSelected(null) }}
                  className={`flex w-full items-center gap-2 border-[3px] px-2 py-2 text-left transition-transform active:translate-y-0.5 ${chapter === i ? 'border-[#7c441a] bg-white' : 'border-[#bc9950] bg-[#f9edbd]'}`}>
                  <span className="h-10 w-1.5 shrink-0" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{c.title}</span>
                    <span className="block truncate text-xs">{obtained}/{c.scenes.length}장면 발견</span>
                  </span>
                  {obtained === 0 && <Icon n="lock" s={17} />}
                </button>
              )
            })}
          </div>
          <div className="pq-inner flex min-w-0 flex-1 flex-col overflow-hidden p-3">
            <div className="mb-2 border-l-[7px] pl-3" style={{ borderColor: ch.color }}>
              <p className="text-xl font-bold">{ch.title}</p>
              <p className="text-sm">{ch.summary}</p>
            </div>
            <div className="flex min-h-0 flex-1 gap-2">
              <div className="scroll-thin w-[220px] shrink-0 space-y-1 overflow-y-auto pr-1">
                {episodes.map((scene, i) => {
                  const ok = storyUnlocked(save, scene)
                  return (
                    <button key={scene.id} disabled={!ok} onClick={() => setSelected(scene.id)}
                      className={`flex w-full items-center gap-2 border-2 p-2 text-left text-sm ${!ok ? 'border-[#b7ac96] bg-[#e6ddc7] opacity-65' : active?.id === scene.id ? 'border-[#ce8032] bg-white font-bold' : 'border-[#c8aa6a] bg-[#fff4d8]'}`}>
                      {ok ? <span className="w-5 shrink-0 text-center text-xs">{i + 1}</span> : <Icon n="lock" s={17} />}
                      <span className="min-w-0 flex-1 truncate">{ok ? scene.title : '미발견 이야기'}</span>
                      {ok && scene.kind !== 'main' && <span className="text-[10px] text-[#9b5a35]">{scene.kind === 'side' ? '외전' : '후일담'}</span>}
                    </button>
                  )
                })}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between border-2 border-[#cca661] bg-[#fff9e9] p-3">
                {active ? (
                  <>
                    <div className="min-h-0 overflow-y-auto">
                      <p className="mb-2 text-xl font-bold text-[#9a531a]">{active.title}</p>
                      <p className="mb-3 text-xs text-[#886843]">{ch.subtitle} · {active.kind === 'main' ? '본편' : active.kind === 'side' ? '숨겨진 기록' : '후일담'}</p>
                      {active.lines.slice(0, 2).map((line, i) =>
                        <p key={i} className="mb-2 text-sm leading-relaxed"><b className="text-[#a37231]">{line.speaker ? line.speaker + ': ' : ''}</b>{line.text.replaceAll('{name}', save.name)}</p>)}
                      <p className="text-xs text-[#a18b69]">모든 장면은 버튼을 눌러 대사창으로 다시 감상할 수 있습니다.</p>
                    </div>
                    <Btn color="green" onClick={() => setReading(active)} className="mt-2 w-full text-base">이야기 다시 보기</Btn>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <Icon n="lock" s={46} />
                    <p className="text-base font-bold">아직 발견하지 못한 기록</p>
                    <p className="text-sm">이 지역을 탐험하고 첫 클리어를 달성해 보세요.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 text-right text-xs text-[#9c7c47]">본편 30장면 · 외전 12장면 · 후일담 4장면 · 총 {ALL_STORY_SCENES.length}장면</p>
      </Panel>
      {reading && <Dialog key={reading.id} lines={reading.lines} name={save.name} onDone={() => setReading(null)} />}
    </>
  )
}
