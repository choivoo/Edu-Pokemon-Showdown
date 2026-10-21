import { describe, expect, it } from 'vitest'
import { STORY_EPISODES, STAGE_EPISODES, stageStory, storyProgress } from './story'
import { defaultSave } from './storage'
import { AREAS, allStages, stageId, STAGES_PER_AREA } from './stages'
import { isDone, QUESTS } from './quests'
describe('별모래섬 장편 스토리',()=>{
 it('30개 본편과 외전12개, 후일담4개를 제공한다',()=>{
   expect(STAGE_EPISODES).toHaveLength(AREAS.length*STAGES_PER_AREA)
   expect(STORY_EPISODES).toHaveLength(46)
   for(const stage of allStages()) expect(stageStory(stage.area,stage.index)?.lines.length).toBeGreaterThanOrEqual(3)
 })
 it('기존 저장 데이터를 건드리지 않고 클리어 기록으로 공개한다',()=>{
   const s=defaultSave()
   expect(storyProgress(s).available).toBe(0)
   s.cleared[stageId(0,0)]=true
   expect(stageStory(0,0)?.unlocked(s)).toBe(true)
   expect(stageStory(0,1)?.unlocked(s)).toBe(false)
 })
 it('보스 클리어 후 본편 퀘스트가 정확히 완료된다',()=>{
   const s=defaultSave()
   s.cleared[stageId(0,4)]=true
   expect(isDone(s, QUESTS.find(q=>q.id==='main-0')!)).toBe(true)
   expect(isDone(s, QUESTS.find(q=>q.id==='main-1')!)).toBe(false)
 })
})
