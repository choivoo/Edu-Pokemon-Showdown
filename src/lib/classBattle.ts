import type { Difficulty, Question, Rng } from '../types'
import { calcDamage, critChance } from './damage'
import { AI_SUCCESS } from './ai'
import { createBattleMon } from './pokedex'
import { effectivenessMessage } from './typeChart'

export interface Fighter {
  name: string
  avatar?: number
  pokemonId: number
  hp: number
  maxHp: number
  opponent: string | null
  score: number
  correct: number
  answered: number
  bot?: boolean
}

export interface Answer { answer: string; ms: number }

export interface Verdict { correct: boolean; damage: number; taken: number; ms: number }

export interface RoundResult {
  fighters: Record<string, Fighter>
  verdicts: Record<string, Verdict>
  events: string[]
}

/** 라운드 난이도 패턴: 쉬움 → 보통 → 보통 → 어려움 반복 */
export const roundDifficulty = (round: number): Difficulty => (['easy', 'normal', 'normal', 'hard'] as const)[round % 4]

export const makeFighter = (name: string, avatar: number, pokemonId: number): Fighter => {
  const m = createBattleMon(pokemonId)
  return { name, avatar, pokemonId, hp: m.maxHp, maxHp: m.maxHp, opponent: null, score: 0, correct: 0, answered: 0 }
}

/** 학생을 2명씩 짝지음. 홀수면 마지막 학생은 AI 트레이너와 대결 */
export function assignPairs(fighters: Record<string, Fighter>, rng: Rng = Math.random, botPokemon: () => number = () => 150): Record<string, Fighter> {
  const ids = Object.keys(fighters).filter(i => !fighters[i].bot)
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
  }
  const out: Record<string, Fighter> = {}
  for (const id of ids) out[id] = { ...fighters[id], opponent: null }
  for (let i = 0; i + 1 < ids.length; i += 2) {
    out[ids[i]].opponent = ids[i + 1]
    out[ids[i + 1]].opponent = ids[i]
  }
  if (ids.length % 2 === 1) {
    const last = ids[ids.length - 1]
    const botId = `bot-${last}`
    const bot = makeFighter('AI 트레이너', 0, botPokemon())
    out[botId] = { ...bot, bot: true, opponent: last }
    out[last].opponent = botId
  }
  return out
}

/** 한 라운드 판정: 정답자만 공격, 더 빨리 맞힌 쪽이 먼저. 먼저 쓰러뜨리면 반격 없음 */
export function resolveRound(question: Question, limitMs: number, input: Record<string, Fighter>, answers: Record<string, Answer | undefined>, check: (q: Question, a: string) => boolean, rng: Rng = Math.random): RoundResult {
  const f: Record<string, Fighter> = {}
  for (const [id, v] of Object.entries(input)) f[id] = { ...v }
  const verdicts: Record<string, Verdict> = {}
  const events: string[] = []

  for (const [id, x] of Object.entries(f)) {
    let correct: boolean
    let ms: number
    if (x.bot) {
      correct = rng() < AI_SUCCESS[question.difficulty]
      ms = limitMs * (0.3 + rng() * 0.6)
    } else {
      const a = answers[id]
      correct = !!a && check(question, a.answer)
      ms = a ? Math.min(limitMs, Math.max(0, a.ms)) : limitMs
      if (a) x.answered++
    }
    verdicts[id] = { correct, damage: 0, taken: 0, ms }
    if (correct && !x.bot) {
      x.correct++
      x.score += 100 + Math.round(100 * (1 - ms / limitMs))
    }
  }

  const done = new Set<string>()
  for (const [id, x] of Object.entries(f)) {
    if (!x.opponent || done.has(id)) continue
    const oid = x.opponent
    done.add(id); done.add(oid)
    const foe = f[oid]
    if (!foe || x.hp <= 0 || foe.hp <= 0) continue
    const order = [id, oid].filter(k => verdicts[k].correct).sort((a, b) => verdicts[a].ms - verdicts[b].ms)
    for (const aid of order) {
      const me = f[aid]
      const tid = me.opponent!
      const target = f[tid]
      if (me.hp <= 0 || target.hp <= 0) continue
      const mon = createBattleMon(me.pokemonId)
      const tmon = createBattleMon(target.pokemonId)
      const move = mon.moves.find(m => m.difficulty === question.difficulty && m.type === mon.types[0]) ?? mon.moves.find(m => m.difficulty === question.difficulty) ?? mon.moves[0]
      const r = calcDamage({
        level: mon.level, power: move.power, atk: mon.atk, def: tmon.def, moveType: move.type, defenderTypes: tmon.types, rng,
        crit: rng() < critChance(1 - verdicts[aid].ms / limitMs),
      })
      target.hp = Math.max(0, target.hp - r.damage)
      verdicts[aid].damage += r.damage
      verdicts[tid].taken += r.damage
      const eff = effectivenessMessage(r.effectiveness)
      events.push(`${me.name}의 ${mon.name} ${move.name}! → ${target.name} -${r.damage}${r.crit ? ' 급소!' : ''}${eff ? ` (${eff})` : ''}`)
      if (target.hp <= 0) {
        me.score += 50
        events.push(`${target.name}의 ${tmon.name}이(가) 쓰러졌다!`)
      }
    }
  }
  return { fighters: f, verdicts, events }
}

/** 모든 대결이 결판났는지 (각 짝 중 한쪽 이상이 쓰러짐) */
export function isDecided(f: Record<string, Fighter>): boolean {
  return Object.values(f).every(x => !x.opponent || x.hp <= 0 || (f[x.opponent]?.hp ?? 0) <= 0)
}

/** 학생 순위: 점수 → 남은 HP */
export function ranking(f: Record<string, Fighter>): Array<[string, Fighter]> {
  return Object.entries(f).filter(([, x]) => !x.bot).sort((a, b) => b[1].score - a[1].score || b[1].hp - a[1].hp)
}
