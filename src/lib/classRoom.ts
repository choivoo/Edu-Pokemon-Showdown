import type { Backend } from './backend'
import type { Difficulty, Question, Subject } from '../types'
import type { Answer, Fighter, Verdict } from './classBattle'

export type RoomStatus = 'lobby' | 'playing' | 'finished'

/** 학생에게 공개되는 문제 (정답·해설 제외) */
export interface PublicQuestion {
  id: string
  type: Question['type']
  question: string
  choices?: string[]
  difficulty: Difficulty
}

export interface RoomState {
  code: string
  status: RoomStatus
  subject: Subject | 'mix'
  totalRounds: number
  round: number
  fighters?: Record<string, Fighter>
  current?: { round: number; q: PublicQuestion; limitSec: number } | null
  lastResult?: {
    round: number
    answer: string
    explanation: string
    events: string[]
    verdicts: Record<string, Verdict>
  } | null
  answers?: Record<string, Record<string, Answer>>
}

const room = (code: string) => `rooms/${code}`

export const toPublic = (q: Question): PublicQuestion => ({
  id: q.id, type: q.type, question: q.question, choices: q.choices, difficulty: q.difficulty,
})

export async function createRoom(be: Backend, subject: Subject | 'mix', totalRounds: number): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000))
    if (await be.get(room(code))) continue
    const s: RoomState = { code, status: 'lobby', subject, totalRounds, round: -1, current: null, lastResult: null }
    await be.set(room(code), { ...s, createdAt: Date.now() })
    return code
  }
  throw new Error('방 코드를 만들지 못했습니다')
}

export async function joinRoom(be: Backend, code: string, pid: string, fighter: Fighter): Promise<void> {
  const r = await be.get<RoomState>(room(code))
  if (!r) throw new Error('방을 찾을 수 없어요. 코드를 확인하세요.')
  if (r.status !== 'lobby' && !r.fighters?.[pid]) throw new Error('이미 시작된 방이에요.')
  if (r.fighters?.[pid]) return // 재접속
  await be.set(`${room(code)}/fighters/${pid}`, fighter)
}

export const subscribeRoom = (be: Backend, code: string, cb: (r: RoomState | null) => void) => be.subscribe<RoomState>(room(code), cb)

export const startGame = (be: Backend, code: string, fighters: Record<string, Fighter>) =>
  be.update(room(code), { status: 'playing', fighters, round: -1, current: null, lastResult: null, answers: null })

export const publishQuestion = (be: Backend, code: string, round: number, q: Question, limitSec: number) =>
  be.update(room(code), { round, current: { round, q: toPublic(q), limitSec }, lastResult: null })

export const submitAnswer = (be: Backend, code: string, round: number, pid: string, a: Answer) =>
  be.set(`${room(code)}/answers/${round}/${pid}`, a)

export const publishResult = (be: Backend, code: string, fighters: Record<string, Fighter>, lastResult: RoomState['lastResult'], finished: boolean) =>
  be.update(room(code), { fighters, lastResult, current: null, ...(finished ? { status: 'finished' } : {}) })

export const closeRoom = (be: Backend, code: string) => be.remove(room(code))
