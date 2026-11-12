/** Level 2 – Speak & Understand (English Detective). Question words, instructions, everyday phrases. */
import { A, L } from './lines'
import type { ChoiceRound } from './types'

export const L2 = {
  intro: [L('Hello, English detective!', 'Merhaba, İngilizce dedektifi!'), L("Let's listen carefully and find the answers!", 'Hadi dikkatle dinleyelim ve cevapları bulalım!')],
  titles: {
    qd: L('Question Detective', 'Soru Dedektifi'),
    listenDo: L('Listen and Do', 'Dinle ve Yap'),
    engTr: L('English or Turkish?', 'İngilizce mi Türkçe mi?'),
    about: L('What About You?', 'Ya sen?'),
  },
}

const ans = {
  kite: A("It's a kite."),
  under: A("It's under the desk."),
  ball: A("It's a ball."),
  teacher: A('The teacher!'),
  morning: A('In the morning.'),
  evening: A('In the evening.'),
}

export const questionDetective: ChoiceRound[] = [
  {
    id: 'what',
    topic: 'question-words',
    skill: 'listening',
    teach: { word: 'What', tr: 'Ne', meaning: 'asks about things', meaningTr: 'şeyler hakkında sorar', wordLine: L('What?', 'Ne?'), line: L('asks about things.', 'Şeyler hakkında sorar.') },
    prompt: L('What is this?', 'Bu ne?'),
    visual: { type: 'mystery', pic: 'obj:kite' },
    options: [
      { id: 'kite', label: ans.kite, correct: true, say: ans.kite },
      { id: 'morning', label: ans.morning, correct: false },
      { id: 'teacher', label: ans.teacher, correct: false },
    ],
    hint: L('What means a thing. Which answer is a thing?', 'What bir şeyi sorar. Hangi cevap bir şey?'),
    layout: 'sentences',
  },
  {
    id: 'where',
    topic: 'question-words',
    skill: 'listening',
    teach: { word: 'Where', tr: 'Nerede', meaning: 'asks about places', meaningTr: 'yerler hakkında sorar', wordLine: L('Where?', 'Nerede?'), line: L('asks about places.', 'Yerler hakkında sorar.') },
    prompt: L('Where is the ball?', 'Top nerede?'),
    visual: { type: 'hidden-ball' },
    options: [
      { id: 'under', label: ans.under, correct: true, say: ans.under },
      { id: 'ball', label: ans.ball, correct: false },
      { id: 'evening', label: ans.evening, correct: false },
    ],
    hint: L('Where means a place. Where did the ball go?', 'Where bir yer sorar. Top nereye gitti?'),
    layout: 'sentences',
  },
  {
    id: 'who',
    topic: 'question-words',
    skill: 'listening',
    teach: { word: 'Who', tr: 'Kim', meaning: 'asks about people', meaningTr: 'insanlar hakkında sorar', wordLine: L('Who?', 'Kim?'), line: L('asks about people.', 'İnsanlar hakkında sorar.') },
    prompt: L('Who is the teacher? Tap her!', 'Öğretmen kim? Ona dokun!'),
    options: [
      { id: 'alya', pic: 'char:alya', correct: false },
      { id: 'teacher', pic: 'char:teacher', correct: true },
    ],
    hint: L("The teacher has long brown hair and no glasses.", 'Öğretmenin uzun kahverengi saçları var ve gözlüğü yok.'),
    after: L("Yes! I'm the teacher!", 'Evet! Öğretmen benim!'),
    layout: 'pictures',
  },
  {
    id: 'which',
    topic: 'question-words',
    skill: 'listening',
    teach: { word: 'Which', tr: 'Hangisi', meaning: 'asks you to choose one', meaningTr: 'birini seçmeni ister', wordLine: L('Which?', 'Hangisi?'), line: L('asks you to choose one.', 'Birini seçmeni ister.') },
    prompt: L('Which racket do you want? The pink one or the purple one?', 'Hangi raketi istersin? Pembe olanı mı, mor olanı mı?'),
    options: [
      { id: 'pink', pic: 'racket:pink', correct: true, say: A('The pink one!') },
      { id: 'purple', pic: 'racket:purple', correct: true, say: A('The purple one!') },
    ],
    hint: L('Choose one racket!', 'Bir raket seç!'),
    after: L('Good choice!', 'Güzel seçim!'),
    layout: 'pictures',
  },
  {
    id: 'when',
    topic: 'question-words',
    skill: 'listening',
    teach: { word: 'When', tr: 'Ne zaman', meaning: 'asks about time', meaningTr: 'zaman hakkında sorar', wordLine: L('When?', 'Ne zaman?'), line: L('asks about time.', 'Zaman hakkında sorar.') },
    prompt: L('When do you play tennis?', 'Ne zaman tenis oynarsın?'),
    options: [
      { id: 'morning', pic: 'time:morning', label: ans.morning, correct: true, say: ans.morning },
      { id: 'evening', pic: 'time:evening', label: ans.evening, correct: true, say: ans.evening },
      { id: 'ball', label: ans.ball, correct: false },
    ],
    hint: L('When means time. Morning or evening?', 'When zamanı sorar. Sabah mı akşam mı?'),
    after: L('Me too! I love tennis!', 'Ben de! Tenisi çok severim!'),
    layout: 'pictures',
  },
  ...(
    [
      ['___ is the ball?', "It's under the desk.", 'Where'],
      ['___ is this?', "It's a doll.", 'What'],
      ['___ is the teacher?', 'She is!', 'Who'],
      ['___ do you play tennis?', 'In the morning.', 'When'],
    ] as const
  ).map(
    ([sentence, answer, correct], i): ChoiceRound => ({
      id: `qword-${correct.toLowerCase()}`,
      topic: 'question-words',
      skill: 'grammar',
      prompt: L('Which question word is missing?', 'Hangi soru kelimesi eksik?'),
      visual: { type: 'qword', sentence, answer },
      options: [correct, ...(['What', 'Where', 'Who', 'When'] as const).filter((w) => w !== correct).slice(i % 2, (i % 2) + 2)]
        .map((w) => ({ id: w, label: w, correct: w === correct, say: A(sentence.replace('___', w)) })),
      hint: L('Look at the answer. Is it a thing, a place, a person or a time?', 'Cevaba bak. Bir şey mi, bir yer mi, bir kişi mi, bir zaman mı?'),
      layout: 'numbers',
    }),
  ),
]

// ---------------------------------------------------------------- listen and do
export const listenDo = {
  pass: L('Pass me the pencil, please!', 'Bana kurşun kalemi uzatır mısın, lütfen!'),
  passHint: L('The pencil is long and yellow. Drag it to my hand!', 'Kurşun kalem uzun ve sarı. Onu elime sürükle!'),
  thanks: L('Thank you!', 'Teşekkür ederim!'),
  welcome: A("You're welcome!"),
  lookAtMe: L('Look at me!', 'Bana bak!'),
  lookHint: L('Look at me! I am waving. Tap me!', 'Bana bak! El sallıyorum. Bana dokun!'),
  open: L('Open the book!', 'Kitabı aç!'),
  openHint: L('Tap the book to open it.', 'Açmak için kitaba dokun.'),
  close: L('Close the book!', 'Kitabı kapat!'),
  closeHint: L('Tap the book again to close it.', 'Kapatmak için kitaba tekrar dokun.'),
  goAway: L("Oh! I'm going away! What do you say to call me?", 'Ah! Gidiyorum! Beni çağırmak için ne dersin?'),
  comeBack: A('Come back!'),
  comeBackOpts: [A('Come back!'), A('Look!'), A('Thank you!')],
  comeBackHint: L('You want me to return. Come... back!', 'Geri dönmemi istiyorsun. Come... back!'),
  imBack: L("I'm back! Well done!", 'Geri döndüm! Aferin!'),
  cool: L('Cool!', 'Havalı!'),
  lookedButton: L("I'm looking at you!", 'Sana bakıyorum!'),
}

// ---------------------------------------------------------------- English or Turkish?
interface EngTr {
  en: string
  tr: string
  options: string[]
  icon: string
}
const engTrData: EngTr[] = [
  { en: 'Look!', tr: 'Bak!', options: ['Bak!', 'Harika!', 'Dinle!'], icon: 'eye' },
  { en: 'Cool!', tr: 'Havalı!', options: ['Bak!', 'Havalı!', 'Gel!'], icon: 'sparkles' },
  { en: 'Listen!', tr: 'Dinle!', options: ['Dinle!', 'Kapat!', 'Teşekkür ederim!'], icon: 'ear' },
  { en: 'Come here!', tr: 'Buraya gel!', options: ['Geri dön!', 'Buraya gel!', 'Bana bak!'], icon: 'hand' },
  { en: 'Thank you!', tr: 'Teşekkür ederim!', options: ['Rica ederim!', 'Teşekkür ederim!', 'Bana söyle!'], icon: 'heart' },
  { en: "You're welcome!", tr: 'Rica ederim!', options: ['Rica ederim!', 'Merhaba!', 'Dikkatle dinle!'], icon: 'smile' },
  { en: 'Tell me!', tr: 'Bana söyle!', options: ['Bana uzat!', 'Bana söyle!', 'Bana bak!'], icon: 'message' },
  { en: 'Close the book!', tr: 'Kitabı kapat!', options: ['Kitabı aç!', 'Kitabı kapat!', 'Kitaba bak!'], icon: 'book' },
]
export const engTrRounds: ChoiceRound[] = engTrData.map((d) => ({
  id: d.en.toLowerCase().replace(/[^a-z]+/g, '-'),
  topic: 'phrases',
  skill: 'listening',
  prompt: L(d.en),
  hideText: true,
  visual: { type: 'listen' },
  options: d.options.map((o) => ({ id: o, label: o, correct: o === d.tr })),
  hint: L(`Listen again: ${d.en}`),
  layout: 'sentences',
}))
export const engTrLead = L('Listen to the English. Choose what it means!', 'İngilizceyi dinle. Ne anlama geldiğini seç!')

// ---------------------------------------------------------------- What about you?
export const aboutYou: ChoiceRound[] = [
  {
    id: 'like-tennis',
    topic: 'what-about-you',
    skill: 'speaking',
    prompt: L('I like tennis. What about you?', 'Ben tenisi severim. Ya sen?'),
    visual: { type: 'teacher-talk', pose: 'happy' },
    options: [
      { id: 'too', label: A('I like tennis too!'), correct: true, say: A('I like tennis too!') },
      { id: 'football', label: A('I like football.'), correct: true, say: A('I like football.') },
      { id: 'swim', label: A('I like swimming.'), correct: true, say: A('I like swimming.') },
      { id: 'pencil', label: A("It's a pencil."), correct: false },
    ],
    hint: L('Tell me what you like. Say: I like ...', 'Neyi sevdiğini söyle. Şöyle de: I like ...'),
    after: L('Great! Thanks for telling me!', 'Harika! Söylediğin için teşekkürler!'),
    speak: { accept: [], pattern: /\bi like\b|\bme too\b|\bi love\b/ },
    layout: 'sentences',
  },
  {
    id: 'happy',
    topic: 'what-about-you',
    skill: 'speaking',
    prompt: L("I'm happy today. What about you?", 'Bugün mutluyum. Ya sen?'),
    visual: { type: 'teacher-talk', pose: 'happy' },
    options: [
      { id: 'happy', label: A("I'm happy too!"), correct: true, say: A("I'm happy too!") },
      { id: 'tired', label: A("I'm tired."), correct: true, say: A("I'm tired.") },
      { id: 'ball', label: A('Yes, it is.'), correct: false },
    ],
    hint: L("Tell me how you feel. Say: I'm happy, or I'm tired.", 'Nasıl hissettiğini söyle: I’m happy ya da I’m tired.'),
    after: L('Thank you for telling me!', 'Söylediğin için teşekkürler!'),
    speak: { accept: [], pattern: /\bi am \w+|\bme too\b/ },
    layout: 'sentences',
  },
  {
    id: 'colour',
    topic: 'what-about-you',
    skill: 'speaking',
    prompt: L('My favourite colour is blue. What about you?', 'En sevdiğim renk mavi. Ya senin?'),
    visual: { type: 'teacher-talk', pose: 'idle' },
    options: [
      { id: 'pink', label: A('My favourite colour is pink.'), correct: true, say: A('My favourite colour is pink.') },
      { id: 'green', label: A('My favourite colour is green.'), correct: true, say: A('My favourite colour is green.') },
      { id: 'blue', label: A('My favourite colour is blue too!'), correct: true, say: A('My favourite colour is blue too!') },
      { id: 'no', label: A("No, it isn't."), correct: false },
    ],
    hint: L('Say: My favourite colour is ...', 'Şöyle de: My favourite colour is ...'),
    after: L('What a lovely colour!', 'Ne güzel bir renk!'),
    speak: { accept: [], pattern: /favou?rite colou?r|\b(pink|blue|green|red|yellow|purple|orange|white|black)\b/ },
    layout: 'sentences',
  },
]
