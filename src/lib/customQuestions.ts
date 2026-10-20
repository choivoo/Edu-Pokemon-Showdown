import type { Difficulty, Question, QuestionType, Subject } from '../types'

const KEY = 'edu-pokemon-showdown:custom-questions:v1'
const SUBJECTS: Subject[] = ['math', 'korean', 'english', 'science']
const DIFFS: Difficulty[] = ['easy', 'normal', 'hard']
const TYPES: QuestionType[] = ['choice', 'ox', 'number']

export interface ParseResult { questions: Question[]; errors: string[] }

/** 한 문제 검증. 문제가 있으면 오류 문자열, 없으면 정규화된 Question */
export function validateQuestion(raw: unknown, label: string): Question | string {
  if (!raw || typeof raw !== 'object') return `${label}: 객체가 아닙니다`
  const r = raw as Record<string, unknown>
  const str = (k: string) => (typeof r[k] === 'string' ? (r[k] as string).trim() : r[k] != null ? String(r[k]) : '')
  const subject = str('subject') as Subject
  const difficulty = str('difficulty') as Difficulty
  const type = str('type') as QuestionType
  if (!SUBJECTS.includes(subject)) return `${label}: subject는 ${SUBJECTS.join('/')} 중 하나여야 합니다`
  if (!DIFFS.includes(difficulty)) return `${label}: difficulty는 easy/normal/hard 중 하나여야 합니다`
  if (!TYPES.includes(type)) return `${label}: type은 choice/ox/number 중 하나여야 합니다`
  const question = str('question')
  const answer = str('answer')
  if (!question) return `${label}: question이 비어 있습니다`
  if (!answer) return `${label}: answer가 비어 있습니다`
  const q: Question = {
    id: str('id') || `custom-${Math.random().toString(36).slice(2, 9)}`,
    subject, difficulty, type, question, answer, explanation: str('explanation') || `정답: ${answer}`,
  }
  if (type === 'choice') {
    const choices = Array.isArray(r.choices) ? r.choices.map(c => String(c).trim()).filter(Boolean) : []
    if (choices.length < 2) return `${label}: choice 유형은 보기가 2개 이상 필요합니다`
    if (!choices.includes(answer)) return `${label}: answer가 보기에 없습니다`
    q.choices = choices
  } else if (type === 'ox') {
    const a = answer.toUpperCase()
    if (a !== 'O' && a !== 'X') return `${label}: ox 유형의 answer는 O 또는 X`
    q.answer = a
  } else if (!Number.isFinite(Number(answer))) {
    return `${label}: number 유형의 answer는 숫자여야 합니다`
  }
  return q
}

function collect(items: unknown[], labelOf: (i: number) => string): ParseResult {
  const questions: Question[] = []
  const errors: string[] = []
  items.forEach((it, i) => {
    const v = validateQuestion(it, labelOf(i))
    typeof v === 'string' ? errors.push(v) : questions.push(v)
  })
  return { questions, errors }
}

/** 붙여넣은 JSON(배열 또는 단일 객체) 파싱 */
export function parseJsonQuestions(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { questions: [], errors: ['JSON 형식이 올바르지 않습니다'] }
  }
  return collect(Array.isArray(data) ? data : [data], i => `#${i + 1}`)
}

/** CSV 한 줄 분리 (큰따옴표, "" 이스케이프 지원) */
function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') { out.push(cur); cur = '' }
    else cur += c
  }
  out.push(cur)
  return out
}

export const CSV_HEADER = 'subject,difficulty,type,question,choices,answer,explanation'

/** CSV: 헤더 행 필수. choices 는 `|` 로 구분 */
export function parseCsvQuestions(text: string): ParseResult {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { questions: [], errors: ['헤더와 1개 이상의 문제 행이 필요합니다'] }
  const header = splitCsvLine(lines[0]).map(h => h.trim())
  const rows = lines.slice(1).map(l => {
    const cells = splitCsvLine(l)
    const o: Record<string, unknown> = {}
    header.forEach((h, i) => { o[h] = (cells[i] ?? '').trim() })
    if (typeof o.choices === 'string') o.choices = o.choices ? (o.choices as string).split('|') : []
    return o
  })
  return collect(rows, i => `${i + 2}행`)
}

export function loadCustomQuestions(): Question[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Question[]) : []
  } catch {
    return []
  }
}

export function saveCustomQuestions(qs: Question[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(qs))
  } catch {
    // 저장 실패 시 무시
  }
}

export function addCustomQuestions(qs: Question[]): Question[] {
  const all = [...loadCustomQuestions(), ...qs]
  saveCustomQuestions(all)
  return all
}
