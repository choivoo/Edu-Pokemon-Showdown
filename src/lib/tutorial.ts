/**
 * New-game-only Pokémon Quest onboarding. Never infer tutorial mode from
 * empty progress on an imported/legacy save: an explicit marker is required.
 * The original sequence is expedition -> Power Charm -> expedition -> cooking
 * -> scripted Pidgey and Rattata recruitment.
 */
import type { SaveData } from './storage'
import type { IngredientId } from './cooking'
import type { WaveEnemy, Stage } from './stages'
import { ORIGINAL_FIRST } from './originalCampaign'
/** Five starter ingredients, available before the first expedition. */
export const TUTORIAL_STEW_INGREDIENTS: IngredientId[] = ['mushroomRed','berryBlue','nutYellow','fossil','rootRed']
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
  [{species:19,level:1}],
  [{species:16,level:1}],
  [{species:52,level:2,elite:true}],
 ] : [
  [{species:10,level:2}],
  [{species:13,level:2}],
  [{species:11,level:3,elite:true}],
 ]
}
/** Ordered tutorial checkpoints based on the original game's prologue. */
export const TUTORIAL_SEQUENCE = [
  '배를 타고 섬 도착 · 모비 재시작',
  '탐험가 이름과 스타팅 포켓몬 선택',
  '1-1 첫 탐험 · 이동·기술 사용',
  '베이스캠프 설치 · P스톤 장착',
  '1-2 두 번째 탐험',
  '요리 냄비 · 네모루루수프 만들기',
  '구구와 꼬렛 합류 · 3마리 팀 완성',
] as const
export interface TutorialBattleHint { title:string; description:string; step:number }
export const TUTORIAL_BATTLE_HINTS = [
  {title:'첫 번째 탐험 · 이동하기',description:'터치한 위치로 달려갈 수 있어요! 화면 왼쪽의 십자 패드나 키보드 WASD로도 상하좌우 이동해 보세요.',step:1},
  {title:'두 가지 기술을 익혀요',description:'화면 아래 포켓몬 옆의 기술 버튼을 누르세요. 각각 별도의 대기시간이 있으며, 적이 가까울 때 사용하면 좋아요.',step:2},
  {title:'적의 공격을 피해요',description:'오른쪽 아래 「흩어지기」를 눌러 공격을 피할 수 있어요. 적을 쓰러뜨리고 마지막 강한 포켓몬까지 이기세요!',step:3},
] as const satisfies readonly TutorialBattleHint[]
/** Independent clue for the first lesson after clearing 1-1. */
export function tutorialHint(phase:TutorialPhase):string {
 switch(phase){
  case 'first-expedition':return '스타팅 포켓몬과 함께 1-1 첫 탐험을 마치세요.'
  case 'power-stone':return '전투에서 얻은 P스톤을 동료의 P애뮬릿 칸에 넣으세요.'
  case 'second-expedition':return '강해진 동료와 1-2 탐험을 클리어하세요.'
  case 'cooking':return '냄비에 재료 다섯 개를 넣고 네모루루수프를 끓여 보세요.'
  case 'friends':return '냄비의 손님 구구와 꼬렛을 차례대로 맞이하세요.'
  case 'complete':return '첫 모험 완료! 세 동료와 함께 섬을 자유롭게 탐험하세요.'
  default:return ''
 }
}
export const ONBOARDING_LINES={
  arrival:[
    {speaker:null,text:'잔잔한 바다 끝으로 신기한 네모루루섬이 모습을 드러냅니다.'},
    {speaker:null,text:'탐사선에는 캠프에 쓸 물건과 작은 탐험 도우미가 실려 있어요.'},
    {speaker:null,text:'배가 해안에 닿자 드론 모비가 섬을 먼저 살펴보러 날아갑니다.'},
    {speaker:'모비',text:'탐색 시작! 멋진 모험이 될 것 같… 어라, 오류?!'},
    {speaker:null,text:'팟! 모비가 모래밭에 떨어지고 화면이 꺼졌어요. 다시 켜 볼까요?'},
  ],
  reboot:[
    {speaker:null,text:'전원 버튼을 꾹 누르자 모비의 표시등이 반짝입니다.'},
    {speaker:'모비',text:'삐빅! 재부팅 완료! 저는 탐험을 돕는 모비예요.'},
    {speaker:'모비',text:'먼저 탐험 일지에 이름을 등록해 주세요. 그리고 이 섬의 동료를 찾아봐요!'},
  ],
  starters:[
    {speaker:'모비',text:'{name} 님, 이곳에는 다섯 마리의 포켓몬이 기다리고 있어요.'},
    {speaker:'모비',text:'이상해씨, 파이리, 꼬부기, 피카츄, 이브이 중 첫 동료 한 마리를 골라 주세요.'},
    {speaker:'모비',text:'선택하면 곧바로 1-1에 출발해요! 이동과 두 기술을 사용하는 방법부터 함께 배워요.'},
  ],
  firstClear:[
    {speaker:null,text:'첫 탐험에 성공했습니다! 해안 근처 넓은 공터에 베이스캠프를 마련했어요.'},
    {speaker:'모비',text:'처음 얻은 반짝이는 P스톤을 기억하나요? 동료의 P애뮬릿에 장착해 봐요!'},
    {speaker:'모비',text:'팀 편성 화면에서 빈 칸을 누르거나 캠프의 「추천 칸에 장착」 버튼을 사용하면 됩니다.'},
    {speaker:'모비',text:'잘했어요! 이제 1-2 탐험으로 한 번 더 실력을 시험해 봐요.'},
  ],
  secondClear:[
    {speaker:'모비',text:'두 번째 탐험도 성공! 이번에는 캠프의 커다란 냄비를 사용할 차례예요.'},
    {speaker:'모비',text:'재료 다섯 개를 넣고 요리를 시작하면 맛있는 냄새가 퍼져요.'},
    {speaker:'모비',text:'첫 요리는 특별한 안내 요리예요. 구구와 꼬렛이 차례대로 찾아오면 둘 다 동료로 맞이해 주세요!'},
  ],
  cooked:[
    {speaker:'모비',text:'보글보글! 네모루루수프 완성! 냄새를 맡고 작은 포켓몬 둘이 찾아왔어요.'},
    {speaker:'모비',text:'첫 손님은 구구예요. 그다음 손님 꼬렛도 꼭 맞이해 주세요!'},
  ],
  finished:[
    {speaker:'모비',text:'구구, 꼬렛, 첫 동료까지 모두 모였군요! 이제 세 마리가 함께 싸울 수 있어요.'},
    {speaker:'모비',text:'모험 지도에서 다음 스테이지를 선택해 보세요. 요리는 언제든 다시 만들 수 있어요!'},
  ],
} as const
