/**
 * New-game-only Pokémon Quest onboarding. Never infer tutorial mode from
 * empty progress on an imported/legacy save: an explicit marker is required.
 * The original sequence is expedition -> Power Charm -> expedition -> cooking
 * -> scripted Pidgey and Rattata recruitment.
 */
import type { SaveData } from './storage'
import type { WaveEnemy, Stage } from './stages'
import { ORIGINAL_FIRST } from './originalCampaign'
export const TUTORIAL_ACTIVE = 'tutorial:guided-v1'
export const TUTORIAL_FINISHED = 'tutorial:completed-v1'
export const TUTORIAL_ACKNOWLEDGED = 'tutorial:completion-seen-v1'
export type TutorialPhase = 'first-expedition' | 'power-stone' | 'second-expedition' | 'cooking' | 'friends' | 'complete' | null
export function tutorialPhase(save:SaveData):TutorialPhase {
  if (!save.seenStory.includes(TUTORIAL_ACTIVE)) return null
  if (save.seenStory.includes(TUTORIAL_FINISHED)) return 'complete'
  if (!save.cleared[`a${ORIGINAL_FIRST}-s0`]) return 'first-expedition'
  const hasStone = save.owned.some(m=>m.stones.length>0)
  if (!hasStone) return 'power-stone'
  if (!save.cleared[`a${ORIGINAL_FIRST}-s1`]) return 'second-expedition'
  if (save.pot || save.owned.some(m=>m.species===16||m.species===19)) return 'friends'
  return 'cooking'
}
export function isTutorialStage(save:SaveData,stage:Stage):boolean {
 const phase=tutorialPhase(save)
 return stage.area===ORIGINAL_FIRST &&
   ((stage.index===0&&phase==='first-expedition')||(stage.index===1&&phase==='second-expedition'))
}
export function canTutorialExplore(save:SaveData,stage:Stage):boolean {
 const phase=tutorialPhase(save)
 if (phase===null || phase==='complete') return true
 return stage.area===ORIGINAL_FIRST &&
    ((phase==='first-expedition'&&stage.index===0)||(phase==='second-expedition'&&stage.index===1))
}
/** Gentle, deterministic first two fights; tutorial has no random boss packs. */
export function tutorialWaves(save:SaveData,stage:Stage):WaveEnemy[][]|null {
 if (!isTutorialStage(save,stage))return null
 return stage.index===0 ? [
  [{species:16,level:1}],
  [{species:19,level:1}],
  [{species:52,level:2,elite:true}],
 ] : [
  [{species:10,level:2}],
  [{species:13,level:2}],
  [{species:11,level:3,elite:true}],
 ]
}
export const ONBOARDING_LINES={
  arrival:[
    {speaker:null,text:'푸른 바다를 건너 작은 탐사선이 네모루루섬에 다가옵니다.'},
    {speaker:null,text:'바닷가에 닻을 내리자 안내 드론 모비가 먼저 섬을 살펴보러 날아갑니다.'},
    {speaker:'모비',text:'삐빅! 미지의 섬 발견! 지형 탐색을 시작… 으앗!'},
    {speaker:null,text:'쿵! 모비가 갑자기 멈춰 모래밭에 떨어졌어요. 다시 작동시켜 볼까요?'},
  ],
  reboot:[
    {speaker:'모비',text:'재부팅 성공! 저는 여러분의 탐험 도우미, 모비입니다.'},
    {speaker:'모비',text:'탐험 기록을 저장할 이름이 필요해요. 어떻게 불러 드릴까요?'},
  ],
  starters:[
    {speaker:'모비',text:'{name} 님! 이 섬에서 함께할 첫 포켓몬을 골라 주세요.'},
    {speaker:'모비',text:'첫 번째 탐험에서 화면의 기술 1·기술 2를 누르는 법과 자유로운 2D 이동을 익혀요. 포켓몬은 기본적으로 스스로 공격합니다.'},
    {speaker:null,text:'스타팅 포켓몬을 선택하면 1-1 첫 전투가 곧바로 시작됩니다. 마지막에는 강적 나옹이 나타납니다!'},
  ],
  firstClear:[
    {speaker:'모비',text:'첫 탐험 성공! 이제 숲속의 공터에 베이스캠프를 세웠어요.'},
    {speaker:'모비',text:'방금 얻은 P스톤을 동료의 P애뮬릿에 넣어 보세요. 체력과 공격력이 올라갑니다!'},
  ],
  secondClear:[
    {speaker:'모비',text:'두 번째 탐험도 성공! 원작처럼 캠프의 첫 요리로 새로운 포켓몬 둘을 만나는 차례예요.'},
    {speaker:'모비',text:'요리 냄비의 다섯 칸에 재료를 넣어 보세요! 첫 번째 요리는 바로 완성되고 구구와 꼬렛이 차례대로 합류합니다.'},
  ],
} as const
