/**
 * Core vocabulary – Cambridge Super Minds 1, Unit 1 (At school) and Unit 2 (Let's play!).
 * British English. To add a new word: add an entry here + a sprite in public/assets/objects.
 */
import { A, L, type Line } from './lines'

export interface Word {
  id: string
  en: string // "pencil case"
  tr: string
  article: 'a' | 'an'
  /** model answer "It's a pencil." spoken by Alya */
  itIs: string
  /** "Kite! It's a kite." – teacher introduction */
  intro: Line
  /** extra accepted spoken forms, e.g. eraser for rubber */
  alt?: string[]
  set: 'school' | 'toys'
}

function w(id: string, en: string, tr: string, set: Word['set'], alt?: string[]): Word {
  const article = /^[aeiou]/i.test(en) ? 'an' : 'a'
  const cap = en[0].toUpperCase() + en.slice(1)
  return {
    id,
    en,
    tr,
    article,
    set,
    alt,
    itIs: A(`It's ${article} ${en}.`),
    intro: L(`${cap}! It's ${article} ${en}.`, `${tr[0].toUpperCase() + tr.slice(1)}!`),
  }
}

export const SCHOOL: Word[] = [
  w('pen', 'pen', 'tükenmez kalem', 'school'),
  w('rubber', 'rubber', 'silgi', 'school', ['eraser']),
  w('pencil', 'pencil', 'kurşun kalem', 'school'),
  w('book', 'book', 'kitap', 'school'),
  w('notebook', 'notebook', 'defter', 'school'),
  w('bag', 'bag', 'çanta', 'school'),
  w('desk', 'desk', 'sıra', 'school'),
  w('ruler', 'ruler', 'cetvel', 'school'),
  w('pencil-case', 'pencil case', 'kalem kutusu', 'school'),
]

export const TOYS: Word[] = [
  w('kite', 'kite', 'uçurtma', 'toys'),
  w('doll', 'doll', 'oyuncak bebek', 'toys'),
  w('monster', 'monster', 'canavar', 'toys'),
  w('plane', 'plane', 'uçak', 'toys'),
  w('computer-game', 'computer game', 'bilgisayar oyunu', 'toys'),
  w('train', 'train', 'tren', 'toys'),
  w('car', 'car', 'araba', 'toys'),
  w('ball', 'ball', 'top', 'toys'),
  w('bike', 'bike', 'bisiklet', 'toys'),
  w('go-kart', 'go-kart', 'go-kart arabası', 'toys'),
]

export const ALL_WORDS = [...SCHOOL, ...TOYS]
export function word(id: string): Word {
  const x = ALL_WORDS.find((v) => v.id === id)
  if (!x) throw new Error('unknown word ' + id)
  return x
}
/** Spoken-answer spec for "What's this?" -> "It's a kite." */
export function itIsSpec(wd: Word) {
  const forms = [wd.en, ...(wd.alt ?? [])]
  return {
    accept: forms.flatMap((f) => [`It's a ${f}`, `It is a ${f}`, `It's an ${f}`, `It is an ${f}`]),
    keyword: wd.en,
    rivals: ALL_WORDS.filter((x) => x.set === wd.set && x.id !== wd.id).map((x) => x.en),
  }
}

export const NUMBERS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
export const NUMBER_LINES = NUMBERS.map((n, i) => L(n[0].toUpperCase() + n.slice(1) + '!', ['Bir', 'İki', 'Üç', 'Dört', 'Beş', 'Altı', 'Yedi', 'Sekiz', 'Dokuz', 'On'][i] + '!'))

export const COLOURS = {
  red: { tr: 'kırmızı', filter: 'hue-rotate(75deg) saturate(2.4)' },
  blue: { tr: 'mavi', filter: 'hue-rotate(-62deg) saturate(2.6) brightness(0.92)' },
  green: { tr: 'yeşil', filter: 'hue-rotate(-140deg) saturate(1.8)' },
  yellow: { tr: 'sarı', filter: 'grayscale(1) sepia(1) saturate(5) hue-rotate(5deg) brightness(1.25)' },
  purple: { tr: 'mor', filter: 'none' },
  pink: { tr: 'pembe', filter: 'hue-rotate(45deg) saturate(1.3) brightness(1.1)' },
} as const
export type Colour = keyof typeof COLOURS
