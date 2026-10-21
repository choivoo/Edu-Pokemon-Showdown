/**
 * 원본 Pokémon Quest Movesheet.xlsx (Move Pools & Stats, No.1~151) 중
 * 기존 저장소에 누락되어 있던 관동 포켓몬만 보충.
 * 이름은 한국어 공식 도감 명칭, 스탯은 원작 HP/ATK 분포를 팬 에디션 전투식에 맞게 정규화한다.
 */
import type { Species, PokemonType } from '../types'
const DATA="10:bug:110:90,11:bug:275:25,12:bug/flying:150:250,14:bug/poison:250:50,15:bug/poison:150:250,21:normal/flying:75:125,22:normal/flying:100:500,23:poison:80:120,24:poison:150:450,27:ground:80:120,28:ground:150:350,29:poison:140:60,30:poison:325:175,31:poison/ground:600:200,32:poison:60:140,33:poison:175:325,34:poison/ground:200:600,36:fairy:450:250,38:fire:550:250,40:normal/fairy:450:150,46:bug/grass:80:120,47:bug/grass:200:500,48:bug/poison:120:80,49:bug/poison:350:350,51:ground:100:600,56:fighting:60:140,57:fighting:150:550,59:fire:350:450,62:water/fighting:350:450,69:grass/poison:80:120,70:grass/poison:250:350,71:grass/poison:300:500,72:water/poison:90:110,73:water/poison:550:150,76:rock/ground:700:100,77:fire:100:100,78:fire:400:400,80:water/psychic:650:150,83:normal/flying:350:350,84:normal/flying:80:120,85:normal/flying:200:500,86:water:110:90,87:water/ice:500:200,88:poison:110:90,89:poison:650:150,90:water:120:80,91:water/ice:575:225,96:psychic:120:80,97:psychic:500:200,98:water:70:130,99:water:100:600,102:grass/psychic:130:70,103:grass/psychic:250:550,105:ground:525:175,106:fighting:50:650,107:fighting:75:625,108:normal:600:100,109:poison:140:60,110:poison:450:350,111:ground/rock:120:80,112:ground/rock:300:500,114:grass:400:300,115:normal:350:350,116:water:90:110,117:water:250:450,118:water:70:130,119:water:350:450,120:water:60:140,121:water/psychic:150:650,122:psychic/fairy:575:125,127:bug:75:725,128:normal:100:600,132:normal:350:350,137:normal:350:350,138:water/rock:140:60,139:water/rock:575:225,140:rock/water:70:130,141:rock/water:150:650,144:ice/flying:600:400,145:electric/flying:350:650,146:fire/flying:500:500"
const NAMES="10:캐터피,11:단데기,12:버터플,14:딱충이,15:독침붕,21:깨비참,22:깨비드릴조,23:아보,24:아보크,27:모래두지,28:고지,29:니드런♀,30:니드리나,31:니드퀸,32:니드런♂,33:니드리노,34:니드킹,36:픽시,38:나인테일,40:푸크린,46:파라스,47:파라섹트,48:콘팡,49:도나리,51:닥트리오,56:망키,57:성원숭,59:윈디,62:강챙이,69:모다피,70:우츠동,71:우츠보트,72:왕눈해,73:독파리,76:딱구리,77:포니타,78:날쌩마,80:야도란,83:파오리,84:두두,85:두트리오,86:쥬쥬,87:쥬레곤,88:질퍽이,89:질뻐기,90:셀러,91:파르셀,96:슬리프,97:슬리퍼,98:크랩,99:킹크랩,102:아라리,103:나시,105:텅구리,106:시라소몬,107:홍수몬,108:내루미,109:또가스,110:또도가스,111:뿔카노,112:코뿌리,114:덩쿠리,115:캥카,116:쏘드라,117:시드라,118:콘치,119:왕콘치,120:별가사리,121:아쿠스타,122:마임맨,127:쁘사이저,128:켄타로스,132:메타몽,137:폴리곤,138:암나이트,139:암스타,140:투구,141:투구푸스,144:프리져,145:썬더,146:파이어"
const nameMap = new Map(NAMES.split(',').map(pair=>{const split=pair.indexOf(':');return [Number(pair.slice(0,split)),pair.slice(split+1)] as const}))
export const KANTO_ADDITIONS: Species[] = DATA.split(',').map(entry => {
 const [idText,typeText,hpText,atkText]=entry.split(':')
 const id=Number(idText),hp=Number(hpText),atk=Number(atkText)
 const types=typeText.split('/') as PokemonType[]
 const main=types[0]
 const legendary=[144,145,146].includes(id)
 const rarity=legendary?4:(hp+atk>=650?3:hp+atk>=350?2:1) as Species['rarity']
 return {
   id,name:nameMap.get(id) ?? '알 수 없음',types,
   stats:{hp:Math.round(hp/6+30),atk:Math.round(atk/6+30),def:Math.max(32,Math.min(120,Math.round((hp+atk)/12))),spe:types.includes('flying')?92:types.includes('rock')?40:types.includes('ground')?45:65},
   rarity,basic:`${main}-easy`,special:`${main}-${rarity>=3?'hard':'normal'}`,
 }
})
