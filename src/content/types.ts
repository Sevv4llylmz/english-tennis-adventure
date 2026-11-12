import type { Line } from './lines'

export type Skill = 'vocabulary' | 'listening' | 'speaking' | 'grammar'

/** Picture references understood by <Pic>: "obj:pencil", "char:teacher", "racket:pink", "time:morning", "fruit:apple". */
export type PicRef = string

export type Visual =
  | { type: 'object'; pic: PicRef; colour?: string }
  | { type: 'count'; pic: PicRef; n: number }
  | { type: 'mystery'; pic: PicRef }
  | { type: 'hidden-ball' }
  | { type: 'listen' }
  | { type: 'teacher-talk'; pose?: 'happy' | 'wave' | 'idle' }
  | { type: 'qword'; sentence: string; answer: string }
  | { type: 'none' }

export interface Option {
  id: string
  label?: string
  pic?: PicRef
  colour?: string
  correct: boolean
  /** spoken in Alya's voice when chosen (model answer) */
  say?: string
}

export interface SpeakSpecData {
  accept: string[]
  keyword?: string
  rivals?: string[]
  pattern?: RegExp
}

export interface ChoiceRound {
  id: string // item key for progress tracking, e.g. "kite"
  topic: string // e.g. "toys", "is-it", "question-words"
  skill: Skill
  prompt: Line
  visual?: Visual
  options: Option[]
  hint: Line
  after?: Line
  speak?: SpeakSpecData
  /** listening rounds: hide the prompt text until answered */
  hideText?: boolean
  /** short teaching card shown before the round */
  teach?: { word: string; tr: string; meaning: string; meaningTr: string; wordLine: Line; line: Line }
  layout?: 'pictures' | 'sentences' | 'numbers'
}
