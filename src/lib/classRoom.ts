import type { Backend } from './backend'
import type { Difficulty, Question, Subject } from '../types'
import { parseJsonQuestions } from './customQuestions'
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
  hostUid?: string
}

const room = (code: string) => `rooms/${code}`
const answersPath = (code: string) => `answers/${code}`

export const toPublic = (q: Question): PublicQuestion => ({
  id: q.id, type: q.type, question: q.question, choices: q.choices, difficulty: q.difficulty,
})

export async function createRoom(be: Backend, subject: Subject | 'mix', totalRounds: number): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000))
    if (await be.get(room(code))) continue
    const s: RoomState = { code, status: 'lobby', subject, totalRounds, round: -1, current: null, lastResult: null, hostUid: be.uid }
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
  Promise.all([be.remove(answersPath(code)), be.update(room(code), { status: 'playing', fighters, round: -1, current: null, lastResult: null })])

export const publishQuestion = (be: Backend, code: string, round: number, q: Question, limitSec: number) =>
  be.update(room(code), { round, current: { round, q: toPublic(q), limitSec }, lastResult: null })

export const submitAnswer = (be: Backend, code: string, round: number, pid: string, a: Answer) =>
  be.set(`${answersPath(code)}/${round}/${pid}`, a)

export const publishResult = (be: Backend, code: string, fighters: Record<string, Fighter>, lastResult: RoomState['lastResult'], finished: boolean) =>
  be.update(room(code), { fighters, lastResult, current: null, ...(finished ? { status: 'finished' } : {}) })

/** 정답 입력은 선생님만 읽을 수 있도록 별도 경로에 둔다 (round -> pid -> answer) */
export const subscribeAnswers = (be: Backend, code: string, cb: (a: Record<string, Record<string, Answer>>) => void) =>
  be.subscribe<Record<string, Record<string, Answer>>>(answersPath(code), v => cb(v ?? {}))

export const closeRoom = async (be: Backend, code: string) => {
  await be.remove(answersPath(code))
  await be.remove(room(code))
}

// ---------- 문제 세트 공유 (선생님 → 학생 기기) ----------
export async function shareQuestionSet(be: Backend, questions: Question[]): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const code = String(1000 + Math.floor(Math.random() * 9000))
    if (await be.get(`sets/${code}`)) continue
    await be.set(`sets/${code}`, { questions, createdAt: Date.now() })
    return code
  }
  throw new Error('공유 코드를 만들지 못했습니다')
}

export async function fetchQuestionSet(be: Backend, code: string): Promise<Question[]> {
  const v = await be.get<{ questions: unknown }>(`sets/${code}`)
  if (!v) throw new Error('해당 코드의 문제 세트를 찾을 수 없어요.')
  const r = parseJsonQuestions(JSON.stringify(v.questions ?? []))
  if (!r.questions.length) throw new Error('가져올 수 있는 문제가 없어요.')
  return r.questions
}
