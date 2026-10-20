import type { Difficulty, Question, Rng, Subject } from '../types'
import { generateMathQuestion, normalizeAnswer } from './mathGenerator'
import math from '../data/questions/math.json'
import korean from '../data/questions/korean.json'
import english from '../data/questions/english.json'
import science from '../data/questions/science.json'
import { loadCustomQuestions } from './customQuestions'

const BUILTIN: Record<Subject, Question[]> = {
  math: math as Question[],
  korean: korean as Question[],
  english: english as Question[],
  science: science as Question[],
}

export const SUBJECT_LABEL: Record<Subject | 'mix', string> = { math: '수학', korean: '국어', english: '영어', science: '과학', mix: '전체' }
export const SUBJECTS = Object.keys(BUILTIN) as Subject[]

const bank = (subject: Subject): Question[] => [...BUILTIN[subject], ...loadCustomQuestions().filter(q => q.subject === subject)]

/** 난이도별 제한시간(초): 어려운 문제일수록 더 길다 */
export const TIME_LIMIT: Record<Difficulty, number> = { easy: 12, normal: 15, hard: 20 }

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * 문제 한 개를 뽑는다. 수학은 자동 생성기 70% + JSON 30%. 선생님이 추가한 문제도 포함.
 * recent에 있는 id는 가능한 한 피한다.
 */
export function pickQuestion(subjectOrMix: Subject | 'mix', difficulty: Difficulty, recent: string[] = [], rng: Rng = Math.random): Question {
  const subject: Subject = subjectOrMix === 'mix' ? SUBJECTS[Math.floor(rng() * SUBJECTS.length)] : subjectOrMix
  if (subject === 'math' && rng() < 0.7) return generateMathQuestion(difficulty, rng)
  const pool = bank(subject).filter(q => q.difficulty === difficulty)
  const fresh = pool.filter(q => !recent.includes(q.id))
  const list = fresh.length > 0 ? fresh : pool
  if (list.length === 0) return generateMathQuestion(difficulty, rng)
  const q = list[Math.floor(rng() * list.length)]
  return q.choices ? { ...q, choices: shuffle(q.choices, rng) } : q
}

export function checkAnswer(q: Question, input: string): boolean {
  return normalizeAnswer(input) === normalizeAnswer(q.answer)
}
