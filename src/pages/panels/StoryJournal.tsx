import { useState } from 'react'
import { useGame } from '../../store/gameStore'
import { STORY_EPISODES, storyProgress, type StoryEpisode } from '../../lib/story'
import Dialog from '../../components/Dialog'
import { Btn } from '../../ui/kit'
import { sfx } from '../../lib/sound'

export default function StoryJournal() {
  const { save, markStory } = useGame()
  const [episode, setEpisode] = useState<StoryEpisode | null>(null)
  const [category, setCategory] = useState<'본편'|'외전'|'후일담'>('본편')
  const progress = storyProgress(save)
  return (
    <div className="pq-inner relative flex h-full flex-col gap-2 overflow-hidden p-3">
      <div className="flex items-center justify-between">
        <div><b className="text-xl">별모래섬 모험일지</b><p className="text-sm">발견한 이야기는 언제든 다시 읽을 수 있어요.</p></div>
        <span className="text-sm font-bold text-[#8a5a10]">발견 {progress.available}/{progress.total} · 읽음 {progress.read}</span>
      </div>
      <div className="flex gap-2">
        {(['본편','외전','후일담'] as const).map(k => <Btn key={k} color={category===k?'yellow':'gray'} onClick={()=>{sfx.select();setCategory(k)}} quiet>{k}</Btn>)}
      </div>
      <div className="scroll-thin grid grid-cols-2 content-start gap-2 overflow-y-auto pb-2">
        {STORY_EPISODES.filter(e=>e.category===category).map(e=>{
          const unlocked=e.unlocked(save)
          const read=save.seenStory.includes(e.id)
          return <button key={e.id} disabled={!unlocked} onClick={()=>{sfx.select();setEpisode(e)}}
            className={`min-h-12 border-4 border-[#2b2838] px-2 py-1 text-left text-sm font-bold ${unlocked?'bg-[#fff3c8] text-[#543a22]':'bg-[#87818b] text-white/80'}`}>
            <span>{unlocked?e.title:'??? · 아직 발견하지 않은 이야기'}</span>
            <span className="float-right text-xs">{read?'읽음':unlocked?'NEW':'잠김'}</span>
          </button>
        })}
      </div>
      {episode && <Dialog key={episode.id} lines={episode.lines} name={save.name} onDone={()=>{markStory(episode.id);setEpisode(null)}} />}
    </div>
  )
}
