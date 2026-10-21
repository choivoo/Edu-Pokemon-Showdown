import { describe, expect, it } from 'vitest'
import { CHRONICLES, chronicleCount, chronicleFor, chronicleUnlocked } from './chronicles'
import { AREAS, STAGES_PER_AREA, stageId } from './stages'

describe('30장 오리지널 모험 기록', () => {
  it('모든 지역과 스테이지에 정확히 한 장씩 연결된다', () => {
    expect(CHRONICLES).toHaveLength(AREAS.length * STAGES_PER_AREA)
    expect(new Set(CHRONICLES.map(c => c.id)).size).toBe(CHRONICLES.length)
    for (let a = 0; a < AREAS.length; a++)
      for (let s = 0; s < STAGES_PER_AREA; s++) {
        const c = chronicleFor(a, s)
        expect(c).not.toBeNull()
        expect(c?.id).toBe(stageId(a, s))
        expect(c?.title.length).toBeGreaterThan(3)
        expect(c?.lines.length).toBeGreaterThanOrEqual(4)
      }
  })
  it('스토리 대사와 화자가 유효하고 미완성 대사가 없다', () => {
    for (const c of CHRONICLES) {
      for (const line of c.lines) {
        expect(line.text.trim().length).toBeGreaterThan(12)
        expect(line.text).not.toMatch(/TODO|TBD|Lorem ipsum/)
        expect(line.speaker === null || typeof line.speaker === 'string').toBe(true)
      }
    }
  })
  it('잠금은 클리어 기록만으로 판단하여 옛날 저장 파일에도 호환된다', () => {
    const cleared: Record<string, true> = {}
    expect(chronicleCount(cleared)).toBe(0)
    const first = CHRONICLES[0]
    expect(chronicleUnlocked(cleared, first)).toBe(false)
    cleared[first.id] = true
    expect(chronicleUnlocked(cleared, first)).toBe(true)
    expect(chronicleCount(cleared)).toBe(1)
  })
  it('지역 밖 요청은 안전하게 null을 반환한다', () => {
    expect(chronicleFor(-1, 0)).toBeNull()
    expect(chronicleFor(99, 99)).toBeNull()
  })
})
