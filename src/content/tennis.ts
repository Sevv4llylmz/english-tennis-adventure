/** Level 5 – Tennis Challenge: question bank and match lines. */
import { A, L, N, shuffle, pick } from './lines'
import { SCHOOL, TOYS, word, itIsSpec, type Word } from './vocab'
import { questionDetective } from './level2'
import { articleItems, buildItems, yesNoRounds } from './level4'
import { YES, NO } from './level1'
import type { ChoiceRound } from './types'

export const L5 = {
  intro: [L("It's time for the big tennis match!", 'Büyük tenis maçının zamanı geldi!'), L('Answer my questions to hit the ball back. Ready?', 'Topa vurmak için sorularımı cevapla. Hazır mısın?')],
  serve: L('Here comes the ball!', 'Top geliyor!'),
  rally: L('Nice shot! Here it comes again!', 'Güzel vuruş! Top yine geliyor!'),
  wrong: L('Good try! Listen again!', 'Güzel deneme! Tekrar dinle!'),
  reveal: L("Here's the answer. Let's remember it!", 'İşte cevap. Hadi bunu hatırlayalım!'),
  teacherPoint: L("My point! Don't worry, let's keep playing!", 'Benim sayım! Merak etme, oynamaya devam!'),
  keepGoing: L("Don't worry, let's keep playing!", 'Merak etme, oynamaya devam!'),
  ohNo: L('Oh no!', 'Eyvah!'),
  points: [L('Fifteen for you!', 'Sana on beş!'), L('Thirty for you!', 'Sana otuz!'), L('Forty for you!', 'Sana kırk!'), L('Game! You win!', 'Oyun! Kazandın!')],
  victory: L('YOU DID IT! English Tennis Champion!', 'BAŞARDIN! İngilizce Tenis Şampiyonu!'),
  congrats: N("Congratulations, {name}! I'm so proud of you!", 'Tebrikler, {name}! Seninle gurur duyuyorum!'),
  speakPrompt: L('Say it! What is it?', 'Söyle! Bu ne?'),
  listenPrompt: L('Listen and choose the picture!', 'Dinle ve resmi seç!'),
  articlePrompt: L('Choose a or an!', 'a ya da an seç!'),
  isntPrompt: L('Choose the right word!', 'Doğru kelimeyi seç!'),
  arrangePrompt: L('Tap the words in the right order!', 'Kelimelere doğru sırayla dokun!'),
}
export const SCORE_NAMES = ['0', '15', '30', '40', 'GAME']

export type TennisQ =
  | { kind: 'choice'; round: ChoiceRound }
  | { kind: 'arrange'; id: string; words: string[]; say: string; pic?: string }
  | { kind: 'speak'; id: string; word: Word }

const whatsThis = L("What's this?", 'Bu ne?')
function identify(wd: Word): TennisQ {
  const pool = wd.set === 'toys' ? TOYS : SCHOOL
  const others = shuffle(pool.filter((x) => x.id !== wd.id)).slice(0, 2)
  return {
    kind: 'choice',
    round: {
      id: wd.id,
      topic: wd.set === 'toys' ? 'toys' : 'school-objects',
      skill: 'vocabulary',
      prompt: whatsThis,
      visual: { type: 'object', pic: `obj:${wd.id}` },
      options: [wd, ...others].map((o) => ({ id: o.id, label: o.itIs, correct: o.id === wd.id, say: o.itIs })),
      hint: L("Look at the picture. Then say: It's a ...", 'Resme bak. Sonra söyle: It’s a ...'),
      layout: 'sentences',
    },
  }
}
function listen(wd: Word): TennisQ {
  const pool = wd.set === 'toys' ? TOYS : SCHOOL
  const others = shuffle(pool.filter((x) => x.id !== wd.id)).slice(0, 2)
  return {
    kind: 'choice',
    round: {
      id: wd.id,
      topic: 'listening-words',
      skill: 'listening',
      prompt: wd.intro,
      hideText: true,
      visual: { type: 'listen' },
      options: [wd, ...others].map((o) => ({ id: o.id, pic: `obj:${o.id}`, correct: o.id === wd.id })),
      hint: L('Listen again carefully!', 'Tekrar dikkatle dinle!'),
      layout: 'pictures',
    },
  }
}
function article(i: number): TennisQ {
  const it = articleItems[i % articleItems.length]
  return {
    kind: 'choice',
    round: {
      id: it.noun,
      topic: 'articles',
      skill: 'grammar',
      prompt: L5.articlePrompt,
      visual: { type: 'qword', sentence: `It's ___ ${it.noun}.`, answer: '' },
      options: (['a', 'an'] as const).map((a) => ({ id: a, label: a, correct: a === it.article, say: a === it.article ? it.say : undefined })),
      hint: L('Does the next word start with a, e, i, o or u?', 'Sonraki kelime a, e, i, o ya da u ile mi başlıyor?'),
      layout: 'numbers',
    },
  }
}
const isntItems = [
  { sentence: 'It ___ a pen.', pic: 'obj:pencil', say: A("It isn't a pen.") },
  { sentence: 'It ___ a car.', pic: 'obj:train', say: A("It isn't a car.") },
  { sentence: 'It ___ a doll.', pic: 'obj:ball', say: A("It isn't a doll.") },
]
function isnt(i: number): TennisQ {
  const it = isntItems[i % isntItems.length]
  return {
    kind: 'choice',
    round: {
      id: 'isnt',
      topic: 'contractions',
      skill: 'grammar',
      prompt: L5.isntPrompt,
      visual: { type: 'object', pic: it.pic },
      options: [
        { id: 'isnt', label: it.sentence.replace('___', "isn't"), correct: true, say: it.say },
        { id: 'is', label: it.sentence.replace('___', 'is'), correct: false },
        { id: 'not', label: it.sentence.replace('___', 'not'), correct: false },
      ],
      hint: L('Look! It is NOT that thing. Use isn\'t.', 'Bak! O şey DEĞİL. isn’t kullan.'),
      layout: 'sentences',
    },
  }
}

/** Builds a mixed question list for the match. Items the student missed earlier come first. */
export function buildTennisQuestions(reviewKeys: string[], count = 10): TennisQ[] {
  const q: TennisQ[] = []
  const used = new Set<string>()
  const add = (t: TennisQ) => {
    const k = t.kind === 'choice' ? `${t.round.topic}:${t.round.id}:${t.round.skill}` : `${t.kind}:${t.id}`
    if (used.has(k)) return
    used.add(k)
    q.push(t)
  }
  // 1) adaptive review (max 4)
  for (const key of reviewKeys.slice(0, 6)) {
    const [topic, item] = key.split(':')
    try {
      if (topic === 'toys' || topic === 'school-objects') add(identify(word(item)))
      else if (topic === 'listening-words') add(listen(word(item)))
      else if (topic === 'articles') add(article(articleItems.findIndex((a) => a.noun === item)))
      else if (topic === 'question-words' && item.startsWith('qword')) {
        const r = questionDetective.find((x) => x.id === item)
        if (r) add({ kind: 'choice', round: r })
      } else if (topic === 'yes-no' || topic === 'is-it') add({ kind: 'choice', round: pick(yesNoRounds) })
      else if (topic === 'contractions') add(isnt(0))
    } catch {
      /* unknown item – skip */
    }
    if (q.length >= 4) break
  }
  // 2) a balanced mix of all eight question types
  const toys = shuffle(TOYS)
  const school = shuffle(SCHOOL)
  const qwords = questionDetective.filter((r) => r.id.startsWith('qword'))
  const mix: TennisQ[] = [
    identify(toys[0]),
    listen(toys[1]),
    { kind: 'choice', round: pick(yesNoRounds) },
    { kind: 'choice', round: pick(qwords) },
    identify(school[0]),
    article(Math.floor(Math.random() * articleItems.length)),
    { kind: 'arrange', id: 'build', ...pick(buildItems) },
    { kind: 'speak', id: toys[2].id, word: toys[2] },
    isnt(Math.floor(Math.random() * 3)),
    listen(school[1]),
    identify(toys[3]),
    { kind: 'speak', id: school[2].id, word: school[2] },
  ]
  for (const m of mix) {
    if (q.length >= count) break
    add(m)
  }
  return q
}

export { itIsSpec, YES, NO }
