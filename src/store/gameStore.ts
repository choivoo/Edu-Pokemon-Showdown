import { create } from 'zustand'
import type { Move, Question, Subject } from '../types'
import { calcDamage, critChance } from '../lib/damage'
import { effectivenessMessage } from '../lib/typeChart'
import { aiSucceeds, chooseAiMove } from '../lib/ai'
import { checkAnswer, pickQuestion } from '../lib/questions'
import { type BattleMon, createBattleMon, getPokemon, POKEMON } from '../lib/pokedex'
import { loadProgress, saveProgress, type Progress } from '../lib/storage'
import { sfx } from '../lib/sound'
import {
  canInflict, effectiveAtk, effectiveSpeed, endOfTurnDamage, paralyzedSkip, STATUS_CHANCE,
  statusForMove, statusMessage, type Status,
} from '../lib/status'
import { statBonus, trainerLevel, unlockPrice } from '../lib/progression'

export type Screen =
  | 'title' | 'profile' | 'team' | 'battle' | 'result'
  | 'teacher' | 'admin' | 'classJoin' | 'classPlay'
export type Mode = 'single' | 'survival'
export type Side = 'player' | 'enemy'
export type Phase = 'choose' | 'question' | 'resolving' | 'ended'

export const TEAM_SIZE = 3
export const ULT_COMBO = 3
const CHAR_MS = 30

export interface BattleState {
  id: number
  mode: Mode
  player: BattleMon[]
  enemy: BattleMon[]
  pi: number
  ei: number
  phase: Phase
  pendingMove: Move | null
  question: Question | null
  combo: number
  maxCombo: number
  correct: number
  total: number
  defeated: number
  message: string
  anim: { side: Side; kind: 'attack' | 'hit' | 'faint'; key: number } | null
  winner: Side | null
  recent: string[]
  lastExplanation: { correct: boolean; text: string } | null
}

export interface BattleReward { exp: number; coins: number; levelUp: number | null; newRecord: boolean }

interface GameState {
  screen: Screen
  progress: Progress
  subject: Subject | 'mix'
  mode: Mode
  team: number[]
  battle: BattleState | null
  reward: BattleReward | null
  go: (s: Screen) => void
  setSubject: (s: Subject | 'mix') => void
  startMode: (m: Mode) => void
  setProfile: (nickname: string, avatar: number) => void
  toggleTeam: (id: number) => void
  unlock: (id: number) => boolean
  startBattle: () => void
  selectMove: (move: Move) => void
  cancelQuestion: () => void
  submitAnswer: (input: string | null, timeLeftRatio: number) => void
  useUltimate: () => void
  switchTo: (index: number) => void
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
let battleSeq = 0
let animKey = 0

const shuffled = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)
const wildLevel = (defeated: number) => Math.min(100, 50 + Math.floor(defeated / 2) * 2)

export const useGame = create<GameState>((set, get) => {
  const patchBattle = (p: Partial<BattleState>) => set(s => (s.battle ? { battle: { ...s.battle, ...p } } : s))
  const alive = (id: number) => get().battle?.id === id

  async function say(id: number, msg: string, extra = 0) {
    if (!alive(id)) return
    patchBattle({ message: msg })
    await sleep(msg.length * CHAR_MS + 450 + extra)
  }

  const mapMon = (side: Side, fn: (m: BattleMon) => BattleMon) =>
    set(s => {
      const b = s.battle!
      const idx = side === 'player' ? b.pi : b.ei
      const key = side === 'player' ? 'player' : 'enemy'
      return { battle: { ...b, [key]: b[key].map((m, i) => (i === idx ? fn(m) : m)) } }
    })

  const damageMon = (side: Side, amount: number) => mapMon(side, m => ({ ...m, hp: Math.max(0, m.hp - amount) }))

  const active = (side: Side): BattleMon => {
    const b = get().battle!
    return side === 'player' ? b.player[b.pi] : b.enemy[b.ei]
  }

  /** 한 번의 공격 연출 + 데미지 + 상태이상 부여 */
  async function attack(id: number, side: Side, move: Move, opts: { crit: boolean; label?: string }) {
    const foeSide: Side = side === 'player' ? 'enemy' : 'player'
    const me = active(side)
    const foe = active(foeSide)
    await say(id, opts.label ?? `${me.name}의 ${move.name}!`)
    if (!alive(id)) return
    patchBattle({ anim: { side, kind: 'attack', key: ++animKey } })
    await sleep(350)
    const res = calcDamage({
      level: me.level, power: move.power, atk: effectiveAtk(me.atk, me.status), def: foe.def,
      moveType: move.type, defenderTypes: foe.types, rng: Math.random, crit: opts.crit,
    })
    if (res.damage > 0) {
      patchBattle({ anim: { side: foeSide, kind: 'hit', key: ++animKey } })
      res.effectiveness > 1 ? sfx.superHit() : sfx.hit()
      damageMon(foeSide, res.damage)
      await sleep(700)
    }
    const msgs: string[] = []
    if (res.crit && res.damage > 0) { msgs.push('급소에 맞았다!'); sfx.crit() }
    const eff = effectivenessMessage(res.effectiveness)
    if (eff) msgs.push(eff)
    for (const m of msgs) await say(id, m)

    // 상태이상
    const st: Status | null = opts.label ? null : statusForMove(move.type)
    const target = active(foeSide)
    if (st && res.damage > 0 && target.hp > 0 && !target.status && canInflict(st, target.types) && Math.random() < STATUS_CHANCE) {
      mapMon(foeSide, m => ({ ...m, status: st }))
      await say(id, statusMessage(target.name, st))
    }
  }

  /** 기절 처리. 전투 종료면 true */
  async function handleFaint(id: number, side: Side): Promise<boolean> {
    const b = get().battle!
    const mon = side === 'player' ? b.player[b.pi] : b.enemy[b.ei]
    if (mon.hp > 0) return false
    patchBattle({ anim: { side, kind: 'faint', key: ++animKey } })
    sfx.faint()
    await say(id, `${mon.name}은(는) 쓰러졌다!`, 400)
    if (!alive(id)) return true

    // 서바이벌: 야생 포켓몬이 계속 등장
    if (b.mode === 'survival' && side === 'enemy') {
      const defeated = b.defeated + 1
      const pool = POKEMON.filter(p => p.id !== mon.id)
      const wild = createBattleMon(pool[Math.floor(Math.random() * pool.length)].id, wildLevel(defeated))
      const heal = Math.floor(get().battle!.player[b.pi].maxHp * 0.25)
      set(s => {
        const bb = s.battle!
        return {
          battle: {
            ...bb, defeated, enemy: [wild], ei: 0, anim: null,
            player: bb.player.map((m, i) => (i === bb.pi ? { ...m, hp: Math.min(m.maxHp, m.hp + heal) } : m)),
          },
        }
      })
      await say(id, `야생의 ${wild.name}(Lv${wild.level})이(가) 나타났다!`)
      return false
    }

    const team = side === 'player' ? b.player : b.enemy
    const idx = side === 'player' ? b.pi : b.ei
    const next = team.findIndex((m, i) => i !== idx && m.hp > 0 && (side === 'enemy' ? i > idx : true))
    if (next === -1) {
      finishBattle(id, side === 'player' ? 'enemy' : 'player')
      return true
    }
    patchBattle(side === 'player' ? { pi: next, anim: null } : { ei: next, anim: null })
    const nm = team[next].name
    await say(id, side === 'player' ? `가랏! ${nm}!` : `상대는 ${nm}을(를) 내보냈다!`)
    return false
  }

  function finishBattle(id: number, winner: Side) {
    if (!alive(id)) return
    const b = get().battle!
    const old = get().progress
    const survival = b.mode === 'survival'
    const win = winner === 'player'
    const exp = survival ? b.defeated * 15 + b.correct * 5 : b.correct * 10 + (win ? 30 : 5)
    const coins = survival ? b.defeated * 5 + b.correct * 2 : b.correct * 2 + (win ? 10 : 0)
    const newRecord = survival && b.defeated > old.bestSurvival
    const progress: Progress = {
      ...old,
      exp: old.exp + exp,
      coins: old.coins + coins,
      wins: old.wins + (win ? 1 : 0),
      losses: old.losses + (win || survival ? 0 : 1),
      bestSurvival: newRecord ? b.defeated : old.bestSurvival,
    }
    const lv = trainerLevel(progress.exp)
    const levelUp = lv > trainerLevel(old.exp) ? lv : null
    saveProgress(progress)
    win ? sfx.win() : sfx.lose()
    set({ progress, reward: { exp, coins, levelUp, newRecord }, battle: { ...b, phase: 'ended', winner } })
    setTimeout(() => { if (alive(id)) set({ screen: 'result' }) }, 1400)
  }

  /** 턴 종료 처리: 독/화상 데미지 */
  async function endOfTurn(id: number): Promise<boolean> {
    for (const side of ['player', 'enemy'] as Side[]) {
      const m = active(side)
      const dmg = m.hp > 0 ? endOfTurnDamage(m.maxHp, m.status) : 0
      if (dmg > 0) {
        patchBattle({ anim: { side, kind: 'hit', key: ++animKey } })
        damageMon(side, dmg)
        await say(id, `${m.name}은(는) ${m.status === 'poison' ? '독' : '화상'} 데미지를 입었다!`)
        if (await handleFaint(id, side)) return true
      }
    }
    return false
  }

  type PlayerAct = { move: Move; crit: boolean; label?: string }

  /** 플레이어 행동(실패 시 null) 이후 턴 전체를 진행. switchIndex가 있으면 교체로 턴을 쓴다. */
  async function resolveTurn(id: number, playerAct: PlayerAct | null, switchIndex?: number) {
    patchBattle({ phase: 'resolving' })
    if (switchIndex !== undefined) {
      const out = active('player').name
      patchBattle({ pi: switchIndex })
      sfx.select()
      await say(id, `돌아와, ${out}! 가랏, ${active('player').name}!`)
    }
    const enemyMon = active('enemy')
    const playerMon = active('player')
    const aiMove = chooseAiMove(enemyMon.moves, playerMon.types)
    const aiAct = { move: aiMove, success: aiSucceeds(aiMove.difficulty) }

    const order: Side[] = []
    if (playerAct) {
      const ps = effectiveSpeed(playerMon.spe, playerMon.status)
      const es = effectiveSpeed(enemyMon.spe, enemyMon.status)
      order.push(...(ps >= es ? (['player', 'enemy'] as Side[]) : (['enemy', 'player'] as Side[])))
    } else order.push('enemy')

    for (const side of order) {
      if (!alive(id)) return
      const m = active(side)
      // 행동 전에 쓰러져 교체된 포켓몬의 행동은 취소
      if (m.hp <= 0 || m.id !== (side === 'player' ? playerMon.id : enemyMon.id)) continue
      if (paralyzedSkip(m.status, Math.random)) {
        await say(id, `${m.name}은(는) 몸이 저려서 움직일 수 없다!`)
        continue
      }
      if (side === 'player') {
        await attack(id, 'player', playerAct!.move, { crit: playerAct!.crit, label: playerAct!.label })
        if (await handleFaint(id, 'enemy')) return
      } else {
        if (aiAct.success) {
          await attack(id, 'enemy', aiAct.move, { crit: Math.random() < 1 / 16 })
        } else {
          await say(id, `상대 ${enemyMon.name}의 ${aiAct.move.name}! 하지만 실패했다!`)
        }
        if (await handleFaint(id, 'player')) return
      }
    }
    if (!alive(id)) return
    if (await endOfTurn(id)) return
    if (!alive(id)) return
    patchBattle({ phase: 'choose', pendingMove: null, question: null, anim: null, message: '무엇을 할까?' })
  }

  const bonus = () => statBonus(get().progress.exp)

  return {
    screen: 'title',
    progress: loadProgress(),
    subject: 'math',
    mode: 'single',
    team: [],
    battle: null,
    reward: null,

    go: screen => set({ screen }),
    setSubject: subject => set({ subject }),
    startMode: mode => {
      const { progress } = get()
      set({ mode, screen: progress.nickname ? 'team' : 'profile' })
    },

    setProfile: (nickname, avatar) => {
      const progress = { ...get().progress, nickname, avatar }
      saveProgress(progress)
      set({ progress })
    },

    toggleTeam: pid =>
      set(s => {
        if (!s.progress.unlocked.includes(pid)) return s
        if (s.team.includes(pid)) return { team: s.team.filter(t => t !== pid) }
        if (s.team.length >= TEAM_SIZE) return s
        return { team: [...s.team, pid] }
      }),

    unlock: pid => {
      const { progress } = get()
      const price = unlockPrice(getPokemon(pid))
      if (progress.unlocked.includes(pid) || progress.coins < price) return false
      const next = { ...progress, coins: progress.coins - price, unlocked: [...progress.unlocked, pid] }
      saveProgress(next)
      set({ progress: next })
      return true
    },

    startBattle: () => {
      const { team, mode } = get()
      if (team.length !== TEAM_SIZE) return
      const id = ++battleSeq
      const b0 = bonus()
      const foes = shuffled(POKEMON.filter(p => !team.includes(p.id))).slice(0, TEAM_SIZE)
      const enemy = mode === 'survival' ? [createBattleMon(foes[0].id)] : foes.map(p => createBattleMon(p.id))
      set({
        screen: 'battle',
        reward: null,
        battle: {
          id, mode, player: team.map(t => createBattleMon(t, 50, b0)), enemy, pi: 0, ei: 0,
          phase: 'resolving', pendingMove: null, question: null, combo: 0, maxCombo: 0,
          correct: 0, total: 0, defeated: 0, message: '', anim: null, winner: null, recent: [], lastExplanation: null,
        },
      })
      void (async () => {
        await say(id, mode === 'survival' ? '서바이벌 시작! 끝까지 버텨라!' : '트레이너 AI가 승부를 걸어왔다!')
        await say(id, mode === 'survival' ? `야생의 ${enemy[0].name}이(가) 나타났다!` : `상대는 ${enemy[0].name}을(를) 내보냈다!`)
        await say(id, `가랏! ${get().battle!.player[0].name}!`)
        patchBattle({ phase: 'choose', message: '무엇을 할까?' })
      })()
    },

    selectMove: move => {
      const b = get().battle
      if (!b || b.phase !== 'choose') return
      sfx.select()
      const q = pickQuestion(get().subject, move.difficulty, b.recent)
      patchBattle({ phase: 'question', pendingMove: move, question: q, lastExplanation: null })
    },

    cancelQuestion: () => {
      const b = get().battle
      if (b?.phase === 'question') patchBattle({ phase: 'choose', pendingMove: null, question: null })
    },

    submitAnswer: (input, timeLeftRatio) => {
      const b = get().battle
      if (!b || b.phase !== 'question' || !b.question || !b.pendingMove) return
      const q = b.question
      const move = b.pendingMove
      const ok = input !== null && checkAnswer(q, input)
      const combo = ok ? b.combo + 1 : 0
      patchBattle({
        correct: b.correct + (ok ? 1 : 0),
        total: b.total + 1,
        combo,
        maxCombo: Math.max(b.maxCombo, combo),
        recent: [...b.recent.slice(-9), q.id],
        lastExplanation: ok ? null : { correct: false, text: `정답: ${q.answer} — ${q.explanation}` },
        question: null,
      })
      const id = b.id
      if (ok) {
        sfx.correct()
        void resolveTurn(id, { move, crit: Math.random() < critChance(timeLeftRatio) })
      } else {
        sfx.wrong()
        void (async () => {
          patchBattle({ phase: 'resolving' })
          await say(id, input === null ? '시간 초과! 기술이 실패했다!' : '오답! 기술이 실패했다!', 600)
          await resolveTurn(id, null)
        })()
      }
    },

    useUltimate: () => {
      const b = get().battle
      if (!b || b.phase !== 'choose' || b.combo < ULT_COMBO) return
      const me = b.player[b.pi]
      const move: Move = { id: 'ultimate', name: '필살기', type: me.types[0], difficulty: 'hard', power: 130 }
      sfx.select()
      patchBattle({ combo: 0 })
      void resolveTurn(b.id, { move, crit: true, label: `${me.name}의 필살기!` })
    },

    switchTo: index => {
      const b = get().battle
      if (!b || b.phase !== 'choose' || index === b.pi || b.player[index]?.hp <= 0) return
      void resolveTurn(b.id, null, index)
    },
  }
})
