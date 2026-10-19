export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy'

export type Difficulty = 'easy' | 'normal' | 'hard'
export type Subject = 'math' | 'korean' | 'english' | 'science'
export type QuestionType = 'choice' | 'ox' | 'number'

export interface Question {
  id: string
  subject: Subject
  difficulty: Difficulty
  type: QuestionType
  question: string
  /** choice 유형: 보기 목록 */
  choices?: string[]
  /** choice: 정답 보기 텍스트 / ox: 'O' | 'X' / number: 숫자 문자열 */
  answer: string
  explanation: string
}

export interface Move {
  id: string
  name: string
  type: PokemonType
  difficulty: Difficulty
  power: number
}

export interface PokemonData {
  id: number
  name: string
  types: PokemonType[]
  stats: { hp: number; atk: number; def: number; spe: number }
  moves: string[]
}

export type Rng = () => number
