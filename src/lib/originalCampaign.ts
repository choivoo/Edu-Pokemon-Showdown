/**
 * Pokémon Quest original-adventure route (2D fan implementation).
 * Campaign order, stage counts and type bonuses follow the original game's island.
 * All cutscene prose is newly written; no retail game dialogue/audio/art assets.
 */
import type { Area, DialogLine, Theme } from './stages'
import type { PokemonType } from '../types'

export const FAN_AREA_COUNT = 6
export const ORIGINAL_FIRST = FAN_AREA_COUNT
export const ORIGINAL_BOSS_AREA = ORIGINAL_FIRST + 10
export const ORIGINAL_LAST = ORIGINAL_BOSS_AREA
export const ORIGINAL_STATUE_COUNT = 10

type Region = {
  name: string; theme: Theme; count: number; level: number; pool: number[]
  boss: number; bossName: string; bonus: PokemonType[]; statue: string
  drops: Area['drops']; icon: string
}

/** 지역 1~11, 원작의 스테이지 개수: 4·5·6·1. */
const REGIONS: Region[] = [
  { name: '출발의초원', theme: 'forest', count: 4, level: 4, pool: [16, 19, 21, 10, 13, 52, 63], boss: 20, bossName: '레트라', bonus: ['fighting'], statue: '번영의석상', drops: ['mushroomRed','berryBlue','nutYellow','fossil'], icon: 'areaForest' },
  { name: '울창한숲', theme: 'forest', count: 5, level: 10, pool: [43, 44, 46, 48, 69, 102, 103], boss: 45, bossName: '라플레시아', bonus: ['fire'], statue: '물의석상', drops: ['rootRed','mushroomRed','nutYellow','honey'], icon: 'areaForest' },
  { name: '굽이치는강', theme: 'beach', count: 5, level: 11, pool: [10, 16, 54, 60, 72, 79, 98, 129], boss: 130, bossName: '갸라도스', bonus: ['grass'], statue: '초목의석상', drops: ['berryBlue','rockBlue','mushroomRed','fossil'], icon: 'areaBeach' },
  { name: '메마른산', theme: 'gorge', count: 5, level: 19, pool: [23, 27, 35, 39, 66, 74, 95], boss: 68, bossName: '괴력몬', bonus: ['flying'], statue: '평온의석상', drops: ['fossil','mushroomGray','rootRed','nutYellow'], icon: 'areaGorge' },
  { name: '배꼽동굴', theme: 'cave', count: 5, level: 21, pool: [19, 27, 41, 50, 66, 74, 95, 104], boss: 76, bossName: '딱구리', bonus: ['water'], statue: '산들바람의석상', drops: ['fossil','rockBlue','berryBlue','mushroomGray'], icon: 'areaCave' },
  { name: '돌침평원', theme: 'gorge', count: 5, level: 23, pool: [13, 14, 15, 21, 48, 111, 112, 123], boss: 127, bossName: '쁘사이저', bonus: ['bug'], statue: '풍요의석상', drops: ['nutYellow','honey','fossil','rootRed'], icon: 'areaGorge' },
  { name: '몽롱의숲', theme: 'forest', count: 6, level: 32, pool: [1, 2, 43, 44, 46, 48, 69, 102, 109, 114], boss: 123, bossName: '스라크', bonus: ['rock'], statue: '정화의석상', drops: ['rootRed','mushroomRed','nutYellow','honey'], icon: 'areaForest' },
  { name: '고요한대지', theme: 'gorge', count: 6, level: 35, pool: [27, 29, 32, 35, 39, 50, 74, 113], boss: 31, bossName: '니드퀸', bonus: ['ground'], statue: '불꽃갈기의석상', drops: ['rockBlue','berryBlue','fossil','nutYellow'], icon: 'areaGorge' },
  { name: '빛나는동굴', theme: 'cave', count: 6, level: 38, pool: [41, 42, 92, 93, 94, 63, 64, 65, 100], boss: 94, bossName: '팬텀', bonus: ['psychic'], statue: '장수의석상', drops: ['mushroomGray','fossil','berryBlue','rootRed'], icon: 'areaCave' },
  { name: '머나먼해안', theme: 'beach', count: 6, level: 41, pool: [54, 55, 72, 73, 79, 80, 86, 87, 117, 119], boss: 131, bossName: '라프라스', bonus: ['electric'], statue: '경외의석상', drops: ['berryBlue','rockBlue','honey','fossil'], icon: 'areaBeach' },
  { name: '전설의공간', theme: 'altar', count: 1, level: 52, pool: [150], boss: 150, bossName: '뮤츠', bonus: [], statue: '', drops: ['rainbow','shell','fossil','mushroomGray'], icon: 'areaAltar' },
]

/** 기존 엔딩의 다음 장으로 연결하는 신규 팬게임 전개. */
const AFTER_ENDING = '더 먼 바다에서 새로운 신호가 잡혔다. 그곳에는 아직 아무 지도에도 기록되지 않은 별모래섬이 있다.'

function talk(speaker: string | null, text: string): DialogLine { return { speaker, text } }

export const ORIGINAL_AREAS: Area[] = REGIONS.map((r, i) => {
  const final = i === 10
  return {
    name: r.name, theme: r.theme, icon: r.icon, levelBase: r.level, pool: r.pool,
    boss: r.boss, bossName: r.bossName, shard: r.statue, drops: r.drops,
    stars: [Math.max(10, 85 - i * 7), Math.min(70, 14 + i * 5), Math.min(40, 1 + i * 2)] as [number,number,number],
    stageCount: r.count, bonusTypes: r.bonus, campaign: 'original' as const,
    intro: final ? [
      talk(null, '모든 석상의 힘이 모이자 바다를 가로지르는 길이 모습을 드러냈다.'),
      talk('모비', '통신 오류… 원인을 알 수 없는 신호…'),
      talk(null, '전설의공간에서 강력한 초능력이 느껴진다. 모비의 이상 행동과 관계가 있을까?'),
    ] : [
      talk('모비', '탐험 가능한 구역을 발견했습니다. 목적지: ' + r.name + '.'),
      talk(null, '섬에 남겨진 고대의 석상과 수수께끼를 풀기 위한 탐험이 이어진다.'),
      talk('모비', r.bonus.length ? '이 지역에서는 특정 타입의 포켓몬이 강해집니다.' : '특별한 탐험을 준비하세요.'),
    ],
    outro: final ? [
      talk(null, '전설의공간의 중심에서 모습을 드러낸 포켓몬은 뮤츠였다.'),
      talk('뮤츠', '석상의 힘이 사라지면서 나를 가둔 문도 열렸다. 이제 이 섬을 떠나겠다.'),
      talk(null, '치열한 전투가 끝나고 뮤츠는 모습을 감춘다. 멈췄던 모비가 다시 작동하기 시작한다.'),
      talk('모비', '새로운 탐험 지역 발견! 바다 건너 기이한 섬이 솟아오르고 있습니다.'),
      talk(null, AFTER_ENDING),
    ] : [
      talk(null, r.bossName + '을(를) 넘어선 탐험대는 고대의 ' + r.statue + '을(를) 발견했다.'),
      talk('모비', '석상의 신호를 기록했습니다. 수집한 석상: ' + (i + 1) + '/10.'),
      ...(i === 9 ? [talk(null, '열 번째 석상이 빛을 내는 순간, 모비가 갑자기 땅으로 떨어졌다.'),talk(null, '멀리서 정체불명의 목소리가 울려 퍼지고 바다 한가운데 길이 열린다.')] : []),
    ],
  }
})

export const ORIGINAL_STAGE_COUNTS = REGIONS.map(r => r.count)

/**
 * 원작과 동일한 해금 순서. 각 묶음의 모든 보스를 클리어하면
 * 다음 묶음의 여러 지역을 동시에 선택할 수 있다.
 */
export const ORIGINAL_GROUPS: readonly (readonly number[])[] = [
  [6], [7,8], [9,10,11], [12,13,14,15], [16],
]

export function isOriginalArea(area: number): boolean {
  return area >= ORIGINAL_FIRST && area <= ORIGINAL_LAST
}

export function originalUnlocked(area: number, cleared: (area: number) => boolean): boolean {
  const group = ORIGINAL_GROUPS.findIndex(g => g.includes(area))
  return group === 0 || (group > 0 && ORIGINAL_GROUPS[group - 1].every(cleared))
}

/** 새로 제작한 요약형 진행 장면. 원작의 대사를 그대로 전재하지 않는다. */
export function originalStageStory(area: number, stage: number): DialogLine[] {
  const index = area - ORIGINAL_FIRST
  const r = REGIONS[index]
  if (!r) return []
  const last = stage === r.count - 1
  if (area === ORIGINAL_BOSS_AREA) return [
    talk(null, '마지막 석상의 봉인이 풀리고, 탐험가 앞에 전설의공간이 열렸다.'),
    talk('모비', '제어 신호를… 차단할 수 없습니다.'),
    talk(null, '모비를 조종한 존재는 뮤츠였다. 모든 석상이 모이면 뮤츠가 풀려난다는 사실이 드러났다.'),
    talk(null, '뮤츠와의 결전 후 새로운 섬이 나타나고, 네모루루섬의 탐험은 새로운 국면으로 접어든다.'),
  ]
  if (area === ORIGINAL_FIRST && stage === 0) return [
    talk('모비', '네모루루섬에 오신 것을 환영합니다! 모험을 시작하겠습니다.'),
    talk(null, '동료 포켓몬과 함께 첫 풀밭을 탐험했다. 야생 포켓몬을 만나 전투 방식을 익힌다.'),
    talk('모비', '쓰러뜨린 포켓몬들이 떨어뜨린 파워스톤을 장착하면 동료가 강해집니다.'),
  ]
  if (area === ORIGINAL_FIRST && stage === 1) return [
    talk(null, '재료가 충분히 모였다. 베이스캠프의 냄비에 재료를 다섯 개 넣어 요리해 보자.'),
    talk('모비', '요리 냄새를 따라 새로운 포켓몬이 찾아올 수 있습니다.'),
    talk(null, '동료를 늘리고 세 마리 탐험대를 구성하면 다음 지역에 도전하기 쉬워진다.'),
  ]
  if (area === 15 && last) return [
    talk(null, r.name + '의 거친 탐험을 끝내고 마지막 석상을 손에 넣었다.'),
    talk('모비', '열 개의 석상 반응 확인. 그런데… 시스템에 알 수 없는 명령이 침투했습니다.'),
    talk(null, '석상들이 빛을 내자 안개가 걷히며 바다 위 전설의공간이 드러난다.'),
  ]
  return [
    talk(null, r.name + '의 ' + (stage + 1) + '번째 탐험. 동료들과 함께 네모루루섬의 안쪽으로 나아간다.'),
    talk('모비', last ? '강력한 우두머리 포켓몬의 반응을 확인했습니다.' : '탐험 지역의 데이터를 기록하고 있습니다.'),
    talk(null, last ? '우두머리를 쓰러뜨리고 석상에 남겨진 고대의 힘을 발견했다.' : '새로운 재료와 파워스톤을 모으며 탐험대를 성장시킨다.'),
  ]
}
