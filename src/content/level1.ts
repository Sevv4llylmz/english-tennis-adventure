/** Level 1 – Warm-Up! (Classroom). Starter + Unit 1 review. */
import { A, L, N } from './lines'
import { COLOURS, NUMBERS, word, itIsSpec, type Colour } from './vocab'
import type { ChoiceRound, Option } from './types'

export const L1 = {
  intro: [L('Welcome to the classroom!', 'Sınıfa hoş geldin!'), L("Let's warm up! Numbers, colours and school things!", 'Hadi ısınalım! Sayılar, renkler ve okul eşyaları!')],
  titles: {
    colour: L('Colour Hunt', 'Renk Avı'),
    count: L('Count and Say', 'Say ve Söyle'),
    pack: L('Pack Your School Bag', 'Okul Çantanı Hazırla'),
    whats: L("What's this?", 'Bu ne?'),
    meet: L('Meet Your Teacher', 'Öğretmeninle Tanış'),
  },
}

// ---------------------------------------------------------------- colour hunt
const trObj: Record<string, string> = {
  book: 'kitabı', bag: 'çantayı', pen: 'tükenmez kalemi', pencil: 'kurşun kalemi', notebook: 'defteri',
}
function colourRound(target: [string, Colour], others: [string, Colour | null][]): ChoiceRound {
  const [obj, col] = target
  const opt = (o: string, c: Colour | null, correct: boolean): Option => ({
    id: `${o}-${c ?? 'natural'}`,
    pic: `obj:${o}`,
    colour: c && o !== 'pencil' ? COLOURS[c].filter : undefined,
    correct,
  })
  return {
    id: `${col}-${obj}`,
    topic: 'colours',
    skill: 'listening',
    prompt: L(`Find the ${col} ${obj}!`, `${cap(COLOURS[col].tr)} ${trObj[obj]} bul!`),
    options: [opt(obj, col, true), ...others.map(([o, c]) => opt(o, c, false))],
    hint: L(`Look for a ${obj}. It is ${col}!`, `Bir ${word(obj).tr} ara. Rengi ${COLOURS[col].tr}!`),
    layout: 'pictures',
  }
}
function cap(s: string) {
  return s[0].toUpperCase() + s.slice(1)
}

export const colourHunt: ChoiceRound[] = [
  colourRound(['book', 'red'], [['book', 'blue'], ['pen', 'red'], ['notebook', 'green']]),
  colourRound(['bag', 'blue'], [['bag', 'yellow'], ['notebook', 'blue'], ['bag', 'pink']]),
  colourRound(['pen', 'green'], [['pen', 'red'], ['book', 'green'], ['pen', 'purple']]),
  colourRound(['pencil', 'yellow'], [['pen', 'blue'], ['notebook', 'yellow'], ['book', 'pink']]),
]

// ---------------------------------------------------------------- count and say
const plural: Record<string, [string, string]> = {
  pencil: ['pencils', 'kurşun kalem'],
  rubber: ['rubbers', 'silgi'],
  book: ['books', 'kitap'],
}
function countRound(obj: string, n: number, opts: number[]): ChoiceRound {
  const [pl, tr] = plural[obj]
  return {
    id: `${obj}-${n}`,
    topic: 'numbers',
    skill: 'vocabulary',
    prompt: L(`How many ${pl} can you see?`, `Kaç tane ${tr} görüyorsun?`),
    visual: { type: 'count', pic: `obj:${obj}`, n },
    options: opts.map((k) => ({ id: String(k), label: `${k} ${NUMBERS[k - 1]}`, correct: k === n, say: A(cap(NUMBERS[k - 1]) + '!') })),
    hint: L("Let's count them together. Touch each one!", 'Hadi birlikte sayalım. Her birine dokun!'),
    speak: { accept: [NUMBERS[n - 1], `${NUMBERS[n - 1]} ${pl}`], rivals: NUMBERS.filter((_, i) => i !== n - 1) },
    layout: 'numbers',
  }
}
export const countAndSay: ChoiceRound[] = [countRound('pencil', 3, [2, 3, 4, 5]), countRound('rubber', 5, [4, 5, 6, 8]), countRound('book', 7, [6, 7, 8, 9])]

// ---------------------------------------------------------------- pack your bag
export const packBag = {
  lead: L("Let's pack your school bag!", 'Hadi okul çantanı hazırlayalım!'),
  rounds: [
    { id: 'pencil', line: L('Put the pencil in the bag!', 'Kurşun kalemi çantaya koy!') },
    { id: 'ruler', line: L('Put the ruler in the bag!', 'Cetveli çantaya koy!') },
    { id: 'rubber', line: L('Put the rubber in the bag!', 'Silgiyi çantaya koy!') },
    { id: 'pencil-case', line: L('Put the pencil case in the bag!', 'Kalem kutusunu çantaya koy!') },
  ],
  items: ['pen', 'pencil', 'ruler', 'rubber', 'notebook', 'book', 'pencil-case'],
  dragHint: L('Drag it into the bag. Or tap it, then tap the bag!', 'Onu çantaya sürükle. Ya da ona dokun, sonra çantaya dokun!'),
}

// ---------------------------------------------------------------- what's this?
const whatsThis = L("What's this?", 'Bu ne?')
function whatRound(obj: string, others: string[], speakIt = false): ChoiceRound {
  const wd = word(obj)
  return {
    id: obj,
    topic: 'school-objects',
    skill: speakIt ? 'speaking' : 'vocabulary',
    prompt: whatsThis,
    visual: { type: 'object', pic: `obj:${obj}` },
    options: [obj, ...others].map((o) => ({ id: o, label: word(o).itIs, correct: o === obj, say: word(o).itIs })),
    hint: L(`Answer with a full sentence: It's a ...`, 'Tam cümleyle cevap ver: It’s a ...'),
    speak: speakIt ? itIsSpec(wd) : undefined,
    layout: 'sentences',
  }
}
function isItRound(shown: string, asked: string): ChoiceRound {
  const yes = shown === asked
  return {
    id: `is-it-${asked}-${yes ? 'yes' : 'no'}`,
    topic: 'is-it',
    skill: 'grammar',
    prompt: L(`Is it ${word(asked).article} ${word(asked).en}?`, `Bu bir ${word(asked).tr} mı?`),
    visual: { type: 'object', pic: `obj:${shown}` },
    options: [
      { id: 'yes', label: YES, correct: yes, say: YES },
      { id: 'no', label: NO, correct: !yes, say: NO },
    ],
    hint: yes ? L('Look! It is the same thing.', 'Bak! Aynı şey.') : L(`Look carefully. Is it ${word(asked).article} ${word(asked).en}?`, `Dikkatli bak. Gerçekten bir ${word(asked).tr} mı?`),
    speak: { accept: yes ? ['yes it is'] : ['no it is not'], rivals: [yes ? 'no' : 'yes'] },
    layout: 'sentences',
  }
}
export const YES = A('Yes, it is.')
export const NO = A("No, it isn't.")

export const whatsThisRounds: ChoiceRound[] = [
  whatRound('pencil', ['pen', 'ruler']),
  isItRound('pencil', 'ruler'),
  whatRound('notebook', ['book', 'bag']),
  isItRound('bag', 'bag'),
  whatRound('rubber', ['pen', 'pencil-case'], true),
  isItRound('desk', 'book'),
]

// ---------------------------------------------------------------- meet your teacher
export function meetRounds(name: string): ChoiceRound[] {
  const ages = ['six', 'seven', 'eight', 'nine']
  return [
    {
      id: 'name',
      topic: 'greetings',
      skill: 'speaking',
      prompt: MEET.askName,
      visual: { type: 'teacher-talk', pose: 'wave' },
      options: [
        { id: 'im', label: `I'm ${name}.`, correct: true },
        { id: 'my', label: `My name is ${name}.`, correct: true },
        { id: 'age', label: MEET.distractAge, correct: false },
      ],
      hint: L("Tell me your name. Say: I'm ...", 'Bana adını söyle. Şöyle de: I’m ...'),
      after: MEET.niceToMeet,
      speak: { accept: [], pattern: /\b(i am|my name is|name is)\b|^[a-zçğıöşü]+$/ },
      layout: 'sentences',
    },
    {
      id: 'age',
      topic: 'greetings',
      skill: 'speaking',
      prompt: MEET.askAge,
      visual: { type: 'teacher-talk', pose: 'happy' },
      options: [
        ...ages.map((a) => ({ id: a, label: `I'm ${a}.`, correct: true, say: A(`I'm ${a}.`) })),
        { id: 'pen', label: MEET.distractPen, correct: false },
      ],
      hint: L('How old are you? Say a number: I\'m seven, I\'m eight...', 'Kaç yaşındasın? Bir sayı söyle: I’m seven, I’m eight...'),
      after: MEET.great,
      speak: { accept: [], pattern: /\b(five|six|seven|eight|nine|ten)\b/ },
      layout: 'sentences',
    },
  ]
}
export const MEET = {
  hello: L("Hello! I'm your teacher. Let's talk!", 'Merhaba! Ben senin öğretmeninim. Hadi konuşalım!'),
  askName: L("What's your name?", 'Adın ne?'),
  askAge: L('How old are you?', 'Kaç yaşındasın?'),
  niceToMeet: N('Nice to meet you, {name}!', 'Tanıştığımıza memnun oldum, {name}!'),
  great: L('Wow! Great!', 'Vay! Harika!'),
  distractAge: A("I'm seven."),
  distractPen: A("It's a pen."),
}
