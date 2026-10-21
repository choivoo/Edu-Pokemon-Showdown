import type { Move, PokemonType, StatusKind } from '../types'

export const STATUS_INFO: Record<StatusKind, { name: string; color: string; short: string }> = {
  poison: { name: '독', color: '#a25bd4', short: '독' },
  paralyze: { name: '마비', color: '#f5d02e', short: '마비' },
  burn: { name: '화상', color: '#ff7a3a', short: '화상' },
  sleep: { name: '잠듦', color: '#7aa8ff', short: 'ZZZ' },
  freeze: { name: '얼음', color: '#8fe4ff', short: '얼음' },
  confuse: { name: '혼란', color: '#ff8fd0', short: '혼란' },
  chain: { name: '사슬묶기', color: '#9a9aa8', short: '사슬' },
}

/** 공격기의 필살기가 맞았을 때 걸릴 수 있는 상태이상 (타입과 상관없이 어떤 타입이든 걸 수 있다) */
export const TYPE_STATUS: Record<PokemonType, StatusKind> = {
  normal: 'sleep', fire: 'burn', water: 'chain', electric: 'paralyze', grass: 'sleep', ice: 'freeze',
  fighting: 'paralyze', poison: 'poison', ground: 'chain', flying: 'confuse', psychic: 'confuse', bug: 'poison',
  rock: 'chain', ghost: 'confuse', dragon: 'paralyze', dark: 'sleep', steel: 'paralyze', fairy: 'sleep',
}
export const STATUS_CHANCE = 0.22

const S = (id: string, name: string, type: PokemonType, role: Move['role'], fx: Move['fx'], learn: PokemonType[]): Move => ({ id, name, type, power: 0, role, fx, learn })

/** 보조기: 버프 / 디버프 / 상태이상 */
export const SUPPORT_MOVES: Move[] = [
  S('bulkup', '벌크업', 'fighting', 'buff', { atk: 0.25, def: 0.25, secs: 8 }, ['fighting', 'rock', 'ground']),
  S('rally', '분발', 'normal', 'buff', { atk: 0.3, secs: 8 }, ['normal', 'fire', 'dragon', 'electric']),
  S('harden', '단단해지기', 'steel', 'buff', { def: 0.4, secs: 9 }, ['steel', 'rock', 'ground', 'water', 'bug']),
  S('calm', '명상', 'psychic', 'buff', { atk: 0.2, def: 0.2, secs: 9 }, ['psychic', 'fairy', 'ghost']),
  S('tailwind', '순풍', 'flying', 'buff', { speed: 0.35, atk: 0.1, secs: 8 }, ['flying', 'bug', 'electric']),
  S('aroma', '아로마테라피', 'grass', 'buff', { heal: 0.3 }, ['grass', 'fairy', 'water', 'normal']),
  S('growl', '울음소리', 'normal', 'debuff', { atk: -0.25, secs: 8 }, ['normal', 'dragon', 'fire', 'fighting']),
  S('stringshot', '실뿜기', 'bug', 'debuff', { speed: -0.4, secs: 8 }, ['bug', 'poison', 'grass', 'ice']),
  S('sandattack', '모래뿌리기', 'ground', 'debuff', { atk: -0.2, speed: -0.15, secs: 8 }, ['ground', 'rock', 'flying', 'water']),
  S('screech', '싫은소리', 'poison', 'debuff', { def: -0.3, secs: 8 }, ['poison', 'dark', 'ghost', 'electric']),
  S('sleeppowder', '수면가루', 'grass', 'status', { status: 'sleep', secs: 3 }, ['grass', 'bug', 'fairy']),
  S('thunderwave', '전기쇼크파', 'electric', 'status', { status: 'paralyze', secs: 5 }, ['electric', 'steel']),
  S('willowisp', '도깨비불', 'fire', 'status', { status: 'burn', secs: 6 }, ['fire', 'ghost', 'dragon']),
  S('toxic', '맹독', 'poison', 'status', { status: 'poison', secs: 7 }, ['poison', 'bug', 'ground']),
  S('confuseray', '이상한빛', 'ghost', 'status', { status: 'confuse', secs: 5 }, ['ghost', 'psychic', 'flying', 'normal']),
  S('bind', '조이기', 'normal', 'status', { status: 'chain', secs: 4 }, ['normal', 'water', 'fighting', 'rock']),
  S('icyfreeze', '얼음숨결', 'ice', 'status', { status: 'freeze', secs: 2.5 }, ['ice', 'water']),
]
