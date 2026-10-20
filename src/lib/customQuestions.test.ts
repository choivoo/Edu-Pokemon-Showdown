import { describe, expect, it } from 'vitest'
import { parseCsvQuestions, parseJsonQuestions } from './customQuestions'

describe('parseJsonQuestions', () => {
  it('정상 배열', () => {
    const r = parseJsonQuestions(JSON.stringify([
      { subject: 'math', difficulty: 'easy', type: 'choice', question: '1+1', choices: ['1', '2'], answer: '2', explanation: 'x' },
      { subject: 'science', difficulty: 'hard', type: 'ox', question: '지구는 둥글다', answer: 'o' },
    ]))
    expect(r.errors).toEqual([])
    expect(r.questions).toHaveLength(2)
    expect(r.questions[1].answer).toBe('O')
  })
  it('잘못된 JSON', () => expect(parseJsonQuestions('{').errors).toHaveLength(1))
  it('검증 오류 수집', () => {
    const r = parseJsonQuestions(JSON.stringify([
      { subject: 'art', difficulty: 'easy', type: 'ox', question: 'q', answer: 'O' },
      { subject: 'math', difficulty: 'easy', type: 'choice', question: 'q', choices: ['a', 'b'], answer: 'c' },
      { subject: 'math', difficulty: 'easy', type: 'number', question: 'q', answer: 'abc' },
    ]))
    expect(r.questions).toHaveLength(0)
    expect(r.errors).toHaveLength(3)
  })
})

describe('parseCsvQuestions', () => {
  it('| 로 구분한 보기와 따옴표 처리', () => {
    const csv = [
      'subject,difficulty,type,question,choices,answer,explanation',
      'math,normal,choice,"3, 4 중 큰 수?",3|4,4,4가 더 커요',
      'english,easy,ox,dog = 개,,O,',
    ].join('\n')
    const r = parseCsvQuestions(csv)
    expect(r.errors).toEqual([])
    expect(r.questions[0].question).toBe('3, 4 중 큰 수?')
    expect(r.questions[0].choices).toEqual(['3', '4'])
    expect(r.questions[1].explanation).toContain('O')
  })
  it('행 번호가 포함된 오류', () => {
    const r = parseCsvQuestions('subject,difficulty,type,question,choices,answer,explanation\nmath,easy,number,q,,x,')
    expect(r.errors[0]).toContain('2행')
  })
})
