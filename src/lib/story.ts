/**
 * 팬 에디션 오리지널 장편 이야기.
 * 원작 포켓몬 퀘스트의 탐험 규칙을 기반으로, 저작권 있는 원작 대사나 음악은 재사용하지 않는다.
 * 지역마다 5개의 독립적인 장면을 배치하고 첫 클리어 때에만 재생한다.
 */
import type { DialogLine } from './stages'
import type { SaveData } from './storage'
import { stageId } from './stages'

interface Beat { title: string; scene: string; discovery: string; answer: string }
export interface StoryEpisode {
  id: string
  title: string
  category: '본편' | '외전' | '후일담'
  area?: number
  lines: DialogLine[]
  unlocked: (save: SaveData) => boolean
}
const MIRA = '미라 박사'
const RIN = '린'
const N = null

/** 하나의 장면이 다음 스테이지의 수수께끼를 이어 가도록 구성한 6개 지역 × 5화. */
const BEATS: Beat[][] = [
  [
    { title: '파도에 밀려온 지도', scene: '해안가에 정체 모를 상자가 밀려왔다. 모서리마다 여섯 개의 별무늬가 새겨져 있다.', discovery: '젖은 뚜껑 아래 지도 조각과 파란 결정 가루가 남아 있어.', answer: '지도에 적힌 화살표를 따라가자. 발자국이 물속으로 이어져!' },
    { title: '거품 속의 신호', scene: '바위틈에서 규칙적으로 거품이 올라온다. 그런데 파도와 방향이 반대다.', discovery: '포켓몬들이 겁내는 게 아니야. 누군가에게 경고하려는 거야.', answer: '해저에 묻힌 낡은 장치를 찾았어. 아직도 작은 불빛이 깜빡여.' },
    { title: '물결의 언어', scene: '조개껍질에 귀를 대자 바람 대신 낮은 울림이 들려왔다.', discovery: '이건 소리라기보다 암호야. 짧게 두 번, 길게 한 번…', answer: '해변의 등대와 같은 리듬이네. 누가 이 신호를 만들었을까?' },
    { title: '폭풍의 기록', scene: '등대의 기록판에는 프리즘이 깨진 날의 물높이가 새겨져 있었다.', discovery: '자연스러운 폭풍이라기엔 파도가 한곳에서 퍼져나갔어.', answer: '섬 중심에 무슨 일이 있었던 거지? 우선 갸라도스를 진정시키자.' },
    { title: '바다가 되찾은 빛', scene: '갸라도스가 마지막 물보라를 일으킨 뒤 바다가 잔잔해졌다.', discovery: '첫 번째 조각이 돌아오자 등대가 다시 빛나기 시작했어!', answer: '그런데 지도 뒤편에 숲을 가리키는 문장이 드러났어. 다음 장소로 가자.' },
  ],
  [
    { title: '말 없는 숲', scene: '숲 입구의 잎사귀들은 바람이 없는데도 한 방향으로 흔들리고 있다.', discovery: '나뭇잎 뒤의 작은 표식, 해변 상자와 꼭 같은 무늬야.', answer: '숲도 우리에게 길을 알려주고 있어. 발밑을 잘 살펴보자.' },
    { title: '사라진 씨앗', scene: '숲의 포켓몬들이 먹이를 모아 두던 장소가 텅 비어 있다.', discovery: '도둑이 아니라 뿌리들이 씨앗을 다른 곳으로 옮겼어.', answer: '어쩌면 숲 전체가 뭔가를 지키려고 움직이는 걸지도 몰라.' },
    { title: '나무의 시계', scene: '오래된 나무의 나이테마다 빛나는 점이 하나씩 박혀 있었다.', discovery: '아주 오랜 시간 동안 여섯 번의 빛이 되풀이되었대.', answer: '프리즘이 깨진 게 이번이 처음이 아니라는 뜻이야?' },
    { title: '숲속의 편지', scene: '덩굴을 걷어내자 이름이 지워진 편지 한 장이 나타났다.', discovery: '「빛을 모으는 자는 빛만을 보지 말 것」… 무슨 뜻일까?', answer: '섬을 구하는 일과 섬의 비밀을 찾는 일은 다를 수도 있어.' },
    { title: '초록빛 약속', scene: '이상해꽃이 자리를 옮기자 무너졌던 숲길에 새싹이 돋아났다.', discovery: '이제 숲의 조각도 안전해. 이 편지는 꼭 가져가자.', answer: '편지의 마지막 글자가 동굴을 가리키는 것 같아.' },
  ],
  [
    { title: '어둠을 비추는 돌', scene: '동굴 벽이 별처럼 반짝이지만 빛을 가까이 대면 도리어 어두워진다.', discovery: '빛을 먹는 광석이라니! 자연에 없는 성질이야.', answer: '그 광석으로 만든 장치가 등대에 있었지. 누군가 연구하고 있었어.' },
    { title: '반대로 움직이는 그림자', scene: '바닥의 그림자들이 포켓몬보다 한 박자 먼저 움직였다.', discovery: '미래를 보여주는 걸까? 아니면 뒤늦게 따라오는 걸까?', answer: '멈췄던 그림자를 따라가 봐. 동굴 깊은 곳에서 웃음소리가 들려.' },
    { title: '잊힌 연구실', scene: '숨겨진 방에는 부서진 기계와 오래된 탐사일지가 놓여 있다.', discovery: '일지에는 「오로라 프리즘 공명 시험」이라고 적혀 있어.', answer: '프리즘은 단순한 보물이 아니었어. 실험을 했던 사람은 누구지?' },
    { title: '장난과 진실', scene: '팬텀이 연구일지를 빼앗아 빙글빙글 돌며 웃는다.', discovery: '지우려는 게 아니야. 마지막 페이지를 펼쳐 보라고 하는 것 같아.', answer: '여기, 손으로 그린 번개 협곡 그림이 있어! 팬텀이 길을 알려줬어.' },
    { title: '어둠이 건넨 단서', scene: '팬텀이 안개를 걷자 광석들이 오래된 별자리 모양을 그렸다.', discovery: '세 번째 조각을 찾았어. 지도에 빠진 선이 이어졌어!', answer: '모든 조각을 모으면 지도도 완성될 것 같아.' },
  ],
  [
    { title: '천둥의 문턱', scene: '협곡을 지나는 전기는 거칠지만 일정한 간격으로 떨어진다.', discovery: '번개가 우연히 치는 게 아니야. 어딘가에 이끌리는 것 같아.', answer: '동료들의 간격을 유지하자. 서로 도울 준비도 하고!' },
    { title: '부서진 피뢰침', scene: '절벽에 쓰러진 거대한 피뢰침에는 여섯 개의 홈이 남아 있다.', discovery: '프리즘 조각을 하나씩 놓을 수 있는 장치였나 봐.', answer: '하지만 홈 하나는 처음부터 비어 있었어. 누군가 계획을 중단했을까?' },
    { title: '전류를 따라', scene: '포켓몬들이 땅의 작은 진동에 맞춰 차례로 움직인다.', discovery: '동료들이 서로 신호를 주고받고 있어. 협력하면 건널 수 있겠어.', answer: '우리가 이 섬에 온 이유도 이제 알 것 같아. 혼자선 풀 수 없는 일이지.' },
    { title: '잠든 발전기', scene: '산 정상의 발전기를 만지자 연구실에서 보았던 이름이 켜졌다.', discovery: '장치에는 「별빛 보호막」이라고 쓰여 있어. 공격 장치가 아니었어!', answer: '그럼 프리즘을 지키려던 시설이었구나. 왜 꺼졌는지 찾아야 해.' },
    { title: '번개가 밝힌 길', scene: '쥬피썬더가 마지막 전기를 털어내자 협곡의 구름이 걷혔다.', discovery: '네 번째 조각이 되돌아오면서 보호막 회로가 하나 살아났어!', answer: '남은 장치를 되살리려면 화산으로 가야겠어.' },
  ],
  [
    { title: '뜨거운 발자취', scene: '용암 너머 작은 발자국들이 화산 중심을 향해 이어진다.', discovery: '위험한 곳을 혼자 건넌 포켓몬이 있었어. 도와줘야겠어.', answer: '발자국 옆에 물에 젖은 천 조각이 있어. 누군가 먼저 와 있었나 봐.' },
    { title: '잿더미의 노래', scene: '분화구 가까이에서 낮고 긴 울림이 밤낮 없이 퍼져 나온다.', discovery: '이 멜로디… 해변에서 들었던 신호와 같은 순서야.', answer: '섬 전체가 하나의 큰 악기처럼 울리고 있었던 거야.' },
    { title: '두 번째 탐험가', scene: '낡은 피난처에 탐험가 린의 배낭과 기록이 남겨져 있다.', discovery: '린은 우리보다 먼저 프리즘을 지키려고 했어. 아직 무사할까?', answer: '편지 마지막엔 「별빛 제단에서 만나자」라고 적혀 있어.' },
    { title: '꺼지지 않는 불꽃', scene: '화산 중앙에는 끊임없이 타오르는 작은 불꽃이 있었다.', discovery: '이 불꽃이 남아 있어서 섬의 빛이 완전히 사라지지 않았나 봐.', answer: '리자몽은 이걸 지키려다 너무 지친 거야. 싸움이 끝나면 쉬게 해주자.' },
    { title: '불꽃의 수호자', scene: '리자몽이 날개를 펴자 분화구에서 다섯 번째 빛이 솟아올랐다.', discovery: '불꽃 조각이 마지막 길을 비춰 줬어. 저 멀리 별빛 제단이 보여!', answer: '린도 거기에 있겠지. 모두의 힘을 모으자.' },
  ],
  [
    { title: '마지막 편지', scene: '제단 앞에 도착하자 탐험가 린이 남긴 기록 장치가 작동했다.', discovery: '「프리즘은 포켓몬의 마음을 비추는 거울이다」…', answer: '포켓몬들이 난폭해진 이유는 조각의 힘보다 두려움 때문일지도 몰라.' },
    { title: '린과의 재회', scene: '제단 뒤에서 지친 탐험가 린이 모습을 드러냈다.', discovery: '린은 포켓몬들을 지키려고 방어 장치를 켰지만 폭풍 때문에 오작동했대.', answer: '이제 누굴 탓하기보다 함께 고치자. 우리에게는 여섯 동료의 믿음이 있어.' },
    { title: '여섯 개의 마음', scene: '모은 프리즘 조각마다 여행 중 만난 포켓몬들의 모습이 비친다.', discovery: '보호막을 켜는 열쇠는 기계가 아니라 우리가 쌓은 신뢰였어!', answer: '망나뇽은 아직 불안해하고 있어. 힘으로 누르지 말고 마음을 전하자.' },
    { title: '별빛을 잇는 다리', scene: '제단의 길이 끊기자 동료들이 몸을 모아 새로운 길을 열었다.', discovery: '빛이 하나씩 이어지고 있어. 우리가 지나온 발자국이 보이는 것 같아.', answer: '이제 바로 앞이야. 끝까지 함께 가자!' },
    { title: '오로라 프리즘', scene: '망나뇽을 진정시키자 여섯 조각이 하늘로 떠올라 하나의 프리즘으로 합쳐졌다.', discovery: '섬 전체에 따스한 빛이 퍼지고 있어. 모두 제자리로 돌아왔어!', answer: '우리의 첫 번째 모험은 끝났지만, 저 별길 너머에는 더 많은 이야기가 기다리고 있어.' },
  ],
]
const scene = (area: number, step: number): DialogLine[] => {
  const b = BEATS[area][step]
  return [
    { speaker: N, text: `제${area+1}장 · ${b.title}` },
    { speaker: N, text: b.scene },
    { speaker: MIRA, text: b.discovery },
    { speaker: step === 2 && area >= 4 ? RIN : MIRA, text: b.answer },
  ]
}
export const STAGE_EPISODES: StoryEpisode[] = BEATS.flatMap((beats, area) =>
  beats.map((b, step) => ({
    id: `chapter-${area}-${step}`,
    title: `${area+1}-${step+1} · ${b.title}`,
    category: '본편' as const, area,
    lines: scene(area, step),
    unlocked: (save: SaveData) => !!save.cleared[stageId(area, step)],
  }))
)
const EXTRA_DATA: Array<[string, string, (s: SaveData) => boolean]> = [
  ['캠프의 첫 저녁', '모험의 첫 저녁. 냄비에서 나는 향기에 포켓몬들이 천천히 모여들었다.', s => !!s.started],
  ['작은 요리사의 비밀', '똑같은 재료라도 순서를 바꾸면 새로운 향기가 나. 특별한 친구가 찾아올지도 몰라.', s => (s.counters.cooked ?? 0) >= 2],
  ['포켓몬의 발자국', '우리가 남긴 길 위로 이제는 여러 포켓몬이 함께 걷고 있어. 모두 서로 다른 걸음걸이를 가졌지.', s => s.dex.length >= 8],
  ['조약돌의 빛', '파워스톤의 무늬를 살펴보니 섬 곳곳의 지형과 닮아 있었다. 돌은 여행의 기록이구나.', s => s.stones.length >= 5],
  ['말하지 않아도', '특훈이 끝나자 포켓몬들이 서로를 바라보았다. 힘보다 중요한 건 함께 배운 시간이었다.', s => (s.counters.trained ?? 0) >= 3],
  ['바닷가의 밤', '캠프가 조용해진 밤, 멀리서 잔잔한 파도와 조개껍질의 노래가 들려왔다.', s => !!s.cleared[stageId(0,4)]],
  ['잎새의 서약', '숲에서 보내온 작은 씨앗이 냄비 옆에 싹텄다. 또 하나의 여행이 시작된 거야.', s => !!s.cleared[stageId(1,4)]],
  ['동굴의 작은 별', '팬텀이 남긴 돌멩이를 비추자 바닥에 여섯 개의 별이 나타났다. 마지막 별은 아직 흐릿했다.', s => !!s.cleared[stageId(2,4)]],
  ['협곡의 전언', '번개 협곡에서 도착한 신호는 짧았다. 「모두 무사해. 계속 앞으로!」', s => !!s.cleared[stageId(3,4)]],
  ['화산에서 온 편지', '린이 남긴 편지의 마지막 문장. 「다른 사람을 믿는 것도 모험가의 용기야.」', s => !!s.cleared[stageId(4,4)]],
  ['도감의 빈자리', '도감을 채울수록 아직 만나지 못한 포켓몬들이 더 궁금해졌다. 모험은 끝이 없나 봐.', s => s.dex.length >= 35],
  ['새로운 동료', '처음에는 세 마리뿐이었는데 어느새 캠프가 북적북적해졌다. 앞으로도 함께 지내자!', s => s.owned.length >= 12],
]
export const SIDE_EPISODES: StoryEpisode[] = EXTRA_DATA.map(([title, text, unlocked], i) => ({
  id: `side-${i}`, title: `외전 ${i+1} · ${title}`, category:'외전',
  lines: [
    { speaker:N, text },
    { speaker:MIRA, text:'작은 순간들이 모여 커다란 여행이 되는 거야. {name}, 오늘의 풍경도 꼭 기억하자.' },
  ], unlocked,
}))
const POST_DATA: Array<[string,string,(s: SaveData)=>boolean]> = [
  ['다시 만난 아침','프리즘이 되살아난 다음 날. 숲과 바다에는 전보다 환한 웃음소리가 가득했다.', s=>!!s.cleared[stageId(5,4)]],
  ['별길의 초대','제단의 빛이 새로운 길을 만들었다. 어디까지 이어질지 모르지만 마음은 벌써 들떠 있다.', s=>s.endlessBest>=1],
  ['열 번째 별','별길의 열 번째 빛이 켜졌다. 탐험가 린이 남긴 지도가 또 한 장 펼쳐졌다.', s=>s.endlessBest>=10],
  ['여행의 끝, 새로운 시작','끝없는 별길 너머에는 처음 출발했던 바다의 푸른빛이 보였다. 다음 여행도 동료들과 함께.', s=>s.endlessBest>=20],
]
export const POST_EPISODES: StoryEpisode[] = POST_DATA.map(([title, text, unlocked], i) => ({
  id:`post-${i}`, title:`후일담 ${i+1} · ${title}`, category:'후일담',
  lines:[{speaker:N,text},{speaker:RIN,text:'섬은 언제든 새로운 수수께끼를 보여줄 거야. 우리, 다시 탐험해 보자!'}],unlocked,
}))
export const STORY_EPISODES = [...STAGE_EPISODES,...SIDE_EPISODES,...POST_EPISODES]
export function stageStory(area: number, index: number): StoryEpisode | null {
  return STAGE_EPISODES.find(e => e.id === `chapter-${area}-${index}`) ?? null
}
export function storyProgress(save: SaveData) {
  return { read: STORY_EPISODES.filter(e=>save.seenStory.includes(e.id)).length, available: STORY_EPISODES.filter(e=>e.unlocked(save)).length, total: STORY_EPISODES.length }
}
