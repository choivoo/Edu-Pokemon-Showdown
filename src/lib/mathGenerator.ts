import type { Difficulty, Question, Rng } from '../types'

const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1))
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** 정답 근처의 겹치지 않는 오답 3개를 만들어 보기를 섞어 반환 */
function numericChoices(answer: number, rng: Rng, spread: number): string[] {
  const set = new Set<number>([answer])
  let guard = 0
  while (set.size < 4 && guard++ < 100) {
    const d = int(rng, 1, spread) * (rng() < 0.5 ? -1 : 1)
    set.add(answer + d)
  }
  let n = 1
  while (set.size < 4) set.add(answer + spread + n++)
  return shuffle([...set], rng).map(String)
}

let seq = 0
const nextId = (d: Difficulty) => `gen-math-${d}-${++seq}`

function base(d: Difficulty, q: string, answer: string, explanation: string): Question {
  return { id: nextId(d), subject: 'math', difficulty: d, type: 'number', question: q, answer, explanation }
}

function choiceQ(d: Difficulty, q: string, answer: string, choices: string[], explanation: string): Question {
  return { ...base(d, q, answer, explanation), type: 'choice', choices }
}

function easy(rng: Rng): Question {
  const kind = int(rng, 0, 2)
  if (kind === 0) {
    const a = int(rng, 1, 20), b = int(rng, 1, 20)
    return choiceQ('easy', `${a} + ${b} = ?`, String(a + b), numericChoices(a + b, rng, 5), `${a} + ${b} = ${a + b}`)
  }
  if (kind === 1) {
    const a = int(rng, 5, 25), b = int(rng, 1, a)
    return choiceQ('easy', `${a} - ${b} = ?`, String(a - b), numericChoices(a - b, rng, 5), `${a} - ${b} = ${a - b}`)
  }
  const a = int(rng, 2, 5), b = int(rng, 2, 5)
  return choiceQ('easy', `${a} × ${b} = ?`, String(a * b), numericChoices(a * b, rng, 6), `${a} × ${b} = ${a * b}`)
}

function normal(rng: Rng): Question {
  const kind = int(rng, 0, 3)
  if (kind === 0) {
    const a = int(rng, 10, 99), b = int(rng, 10, 99)
    return base('normal', `${a} + ${b} = ?`, String(a + b), `${a} + ${b} = ${a + b}`)
  }
  if (kind === 1) {
    const a = int(rng, 30, 99), b = int(rng, 10, a - 1)
    return base('normal', `${a} - ${b} = ?`, String(a - b), `${a} - ${b} = ${a - b}`)
  }
  if (kind === 2) {
    const a = int(rng, 3, 9), b = int(rng, 3, 9)
    return choiceQ('normal', `${a} × ${b} = ?`, String(a * b), numericChoices(a * b, rng, 8), `${a} × ${b} = ${a * b}`)
  }
  const b = int(rng, 2, 9), q = int(rng, 2, 12)
  return base('normal', `${b * q} ÷ ${b} = ?`, String(q), `${b} × ${q} = ${b * q} 이므로 ${b * q} ÷ ${b} = ${q}`)
}

function fractionStr(n: number, d: number): string {
  const g = gcd(n, d)
  const nn = n / g, dd = d / g
  return dd === 1 ? String(nn) : `${nn}/${dd}`
}

function hard(rng: Rng): Question {
  const kind = int(rng, 0, 2)
  if (kind === 0) {
    // ax + b = c (정수 해)
    const x = int(rng, 1, 12), a = int(rng, 2, 9), b = int(rng, 1, 20)
    return base('hard', `${a}x + ${b} = ${a * x + b} 일 때, x = ?`, String(x),
      `${a}x = ${a * x + b} - ${b} = ${a * x}, 따라서 x = ${x}`)
  }
  if (kind === 1) {
    // 분수 덧셈 (서로 다른 분모)
    const d1 = int(rng, 2, 6)
    let d2 = int(rng, 2, 6)
    while (d2 === d1) d2 = int(rng, 2, 6)
    const n1 = int(rng, 1, d1 - 1), n2 = int(rng, 1, d2 - 1)
    const num = n1 * d2 + n2 * d1, den = d1 * d2
    const answer = fractionStr(num, den)
    const wrong = new Set<string>()
    const cands = [fractionStr(n1 + n2, d1 + d2), fractionStr(num + 1, den), fractionStr(Math.max(1, num - 1), den), fractionStr(num, den + 1), fractionStr(num + 2, den)]
    for (const c of cands) if (c !== answer && wrong.size < 3) wrong.add(c)
    return choiceQ('hard', `${n1}/${d1} + ${n2}/${d2} = ?  (기약분수)`, answer, shuffle([answer, ...wrong], rng),
      `통분하면 ${n1 * d2}/${den} + ${n2 * d1}/${den} = ${num}/${den} = ${answer}`)
  }
  // 괄호가 있는 혼합 계산
  const a = int(rng, 2, 9), b = int(rng, 2, 9), c = int(rng, 2, 9)
  return base('hard', `(${a} + ${b}) × ${c} - ${a} = ?`, String((a + b) * c - a),
    `(${a} + ${b}) × ${c} = ${(a + b) * c}, 여기서 ${a}를 빼면 ${(a + b) * c - a}`)
}

export function generateMathQuestion(difficulty: Difficulty, rng: Rng = Math.random): Question {
  return difficulty === 'easy' ? easy(rng) : difficulty === 'normal' ? normal(rng) : hard(rng)
}

/** 숫자 입력 정답 비교용 (분수 문자열도 동일 비교) */
export function normalizeAnswer(s: string): string {
  return s.trim().replace(/\s+/g, '')
}
