/**
 * Every spoken line is created through L() / A() so tools can list them all
 * (npm run voices -> scripts/export-lines.ts -> tools/gen_voices.py).
 * Content files must stay free of browser-only imports.
 */
export interface Line {
  en: string
  tr?: string
}

const registry = new Map<string, { voice: 'teacher' | 'alya' | 'tr'; text: string }>()
function reg(voice: 'teacher' | 'alya' | 'tr', text: string) {
  if (text) registry.set(`${voice}|${text}`, { voice, text })
}

/** Teacher line with optional Turkish help. */
export function L(en: string, tr?: string): Line {
  reg('teacher', en)
  if (tr) reg('tr', tr)
  return { en, tr }
}
/** A model answer spoken in Alya's (child) voice. */
export function A(en: string): string {
  reg('alya', en)
  return en
}
export function allLines() {
  return [...registry.values()]
}

/** Lines that include the player's name. Pre-recorded for the default name only. */
export const DEFAULT_NAME = 'Alya'
export function named(template: string, name: string) {
  return template.replace(/\{name\}/g, name)
}
export function N(template: string, tr?: string): Line {
  reg('teacher', named(template, DEFAULT_NAME))
  if (tr) reg('tr', named(tr, DEFAULT_NAME))
  return { en: template, tr }
}

export const PRAISE = [
  L('Great job!', 'Harika iş!'),
  L('Excellent!', 'Mükemmel!'),
  L('Well done!', 'Aferin!'),
  L("That's right!", 'Doğru!'),
  L('Super!', 'Süper!'),
]
export const TRY = [
  L('Good try!', 'Güzel deneme!'),
  L('Almost!', 'Az kaldı!'),
  L("Let's try again!", 'Hadi tekrar deneyelim!'),
]
export const UI = {
  yourTurn: L('Your turn!', 'Sıra sende!'),
  listenAgain: L("Let's listen again!", 'Hadi tekrar dinleyelim!'),
  listenCarefully: L('Listen carefully!', 'Dikkatle dinle!'),
  tapMic: L('Tap the microphone and say it.', 'Mikrofona dokun ve söyle.'),
  listening: L("I'm listening!", 'Dinliyorum!'),
  noHear: L("I didn't hear you. Let's try again!", 'Seni duyamadım. Hadi tekrar deneyelim!'),
  recognized: L('Answer recognized!', 'Cevap anlaşıldı!'),
  wholeSentence: L('Good! Now say the whole sentence!', 'Güzel! Şimdi cümlenin tamamını söyle!'),
  otherAnswer: L("Hmm, that's a different answer. Listen and try again!", 'Hmm, bu farklı bir cevap. Dinle ve tekrar dene!'),
  tapInstead: L('You can tap the answer, too.', 'Cevaba dokunarak da seçebilirsin.'),
  next: L("Let's go on!", 'Devam edelim!'),
  activityDone: L('You did it! Next challenge!', 'Başardın! Sıradaki göreve!'),
  locked: L('This place is still locked. Finish the challenge before it first!', 'Burası hâlâ kilitli. Önce ondan önceki görevi bitir!'),
  tennisLocked: L('The tennis match opens when you finish all four challenges!', 'Tenis maçı, dört görevi de bitirince açılır!'),
  chooseLevel: L('Choose a challenge on the map!', 'Haritadan bir görev seç!'),
  levelComplete: L('Fantastic! You earned a new reward!', 'Harika! Yeni bir ödül kazandın!'),
}

export const WELCOME = {
  askName: L("Hello! What's your name?", 'Merhaba! Adın ne?'),
  hi: N('Hi, {name}!', 'Merhaba, {name}!'),
  welcome: L('Welcome to your English Adventure!', 'İngilizce Maceranıza hoş geldin!'),
  ready: L('Are you ready to play?', 'Oynamaya hazır mısın?'),
  welcomeBack: N('Welcome back, {name}!', 'Tekrar hoş geldin, {name}!'),
  menu: L('Ready for an adventure?', 'Maceraya hazır mısın?'),
  story1: L('Welcome to the English Adventure Academy!', 'İngilizce Macera Akademisine hoş geldin!'),
  story2: L('Complete your challenges and collect your stars!', 'Görevlerini tamamla ve yıldızlarını topla!'),
  story3: L('Then get ready for the big tennis match!', 'Sonra büyük tenis maçına hazırlan!'),
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
