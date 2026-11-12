/** Level 4 – Sentence Magic (Grammar Room). */
import { A, L } from './lines'
import { word } from './vocab'
import type { ChoiceRound } from './types'
import { YES, NO } from './level1'

export const L4 = {
  intro: [L('Welcome to the Grammar Room!', 'Dilbilgisi Odasına hoş geldin!'), L('Watch the words move and change. It is magic!', 'Kelimelerin hareket edip değişmesini izle. Bu bir sihir!')],
  titles: {
    question: L('It is or Is it?', 'It is mi, Is it mi?'),
    its: L("It's = It is", "It's = It is"),
    isnt: L("Isn't = Is not", "Isn't = Is not"),
    yesno: L('Yes or No?', 'Evet mi Hayır mı?'),
    article: L('A or An?', 'A mı An mı?'),
    build: L('Build a Sentence', 'Cümle Kur'),
  },
  // It is -> Is it
  statement: A('It is a pencil.'),
  question: A('Is it a pencil?'),
  qExplain1: L('This is a sentence. It tells us something.', 'Bu bir cümle. Bize bir şey anlatır.'),
  qExplain2: L('Watch! The word "is" jumps to the front. Now it is a question!', 'İzle! "is" kelimesi başa zıplıyor. Artık bir soru!'),
  qYourTurn: L('Your turn! Move the words to make a question.', 'Sıra sende! Kelimeleri taşıyarak bir soru yap.'),
  qTask2: L('Make a question: Is it a ball?', 'Bir soru yap: Is it a ball?'),
  qBall: A('Is it a ball?'),
  qHint: L('Questions start with Is. Then it, a, ball, and a question mark.', 'Sorular Is ile başlar. Sonra it, a, ball ve soru işareti.'),
  // It's
  itsExplain: L('"It is" can be short: "It\'s". The little mark is called an apostrophe. Same meaning!', '"It is" kısalabilir: "It\'s". Bu küçük işaretin adı kesme işareti. Anlamı aynı!'),
  itIsBall: A('It is a ball.'),
  itsBall: A("It's a ball."),
  itsCheck: L('Which one is the short form of: It is a doll?', '"It is a doll" cümlesinin kısa hali hangisi?'),
  // isn't
  isntExplain: L('"Is not" can be short too: "isn\'t". Both are correct. Same meaning!', '"Is not" da kısalabilir: "isn\'t". İkisi de doğru. Anlamı aynı!'),
  isNotPen: A('It is not a pen.'),
  isntPen: A("It isn't a pen."),
  toggle: L('Tap the button to switch between the long and short forms.', 'Uzun ve kısa hal arasında geçiş için düğmeye dokun.'),
  // card explanations (shown on the cards, Turkish on the TR button)
  statementInfo: L('A statement tells us something. Your voice goes down.', 'Düz cümle bize bir şey anlatır. Cümlenin sonunda sesimiz alçalır.'),
  questionInfo: L('A question asks something. Your voice goes up.', 'Soru cümlesi bir şey sorar. Cümlenin sonunda sesimiz yükselir.'),
  itsHow: L("is becomes 's. The i goes away and a little mark comes in.", 'is kısalınca i harfi gider, yerine küçük bir kesme işareti gelir.'),
  itsSame: L("It is = It's. Same meaning!", "It is ile It's aynı anlama gelir!"),
  isntHow: L("not becomes n't. The o goes away and a little mark comes in.", 'not kısalınca o harfi gider, yerine küçük bir kesme işareti gelir.'),
  isntSame: L("is not = isn't. Same meaning! Both are correct.", "is not ile isn't aynı anlama gelir. İkisi de doğru!"),
  // a / an
  aExplain: L('We say "a" before most words: a ball, a kite, a doll.', 'Kelime b, k, d, p gibi bir harfle başlıyorsa, önüne a gelir. Top, uçurtma ve oyuncak bebek kelimeleri böyle.'),
  anExplain: L('We say "an" when the next word starts with a, e, i, o or u: an apple, an orange, an ugly monster.', 'Kelime a, e, i, o ya da u harfiyle başlıyorsa, önüne an gelir. Böylece söylemesi kolay olur, dilimiz takılmaz. Elma, portakal ve çirkin canavar kelimeleri böyle.'),
  articleTask: L('Drag a or an into the gap!', 'Boşluğa a ya da an sürükle!'),
  articleHint: L('Say the next word out loud. Does it start with a, e, i, o or u?', 'Sonraki kelimeyi yüksek sesle söyle. a, e, i, o ya da u ile mi başlıyor?'),
  // build
  buildLead: L('Put the words in the right order!', 'Kelimeleri doğru sıraya koy!'),
  buildHint: L('Look at the first word. Sentences start with a capital letter.', 'İlk kelimeye bak. Cümleler büyük harfle başlar.'),
}

export const articleItems: { noun: string; article: 'a' | 'an'; pic: string; say: string }[] = [
  { noun: 'pencil', article: 'a', pic: 'obj:pencil', say: A("It's a pencil.") },
  { noun: 'apple', article: 'an', pic: 'fruit:apple', say: A("It's an apple.") },
  { noun: 'ball', article: 'a', pic: 'obj:ball', say: A("It's a ball.") },
  { noun: 'orange', article: 'an', pic: 'fruit:orange', say: A("It's an orange.") },
  { noun: 'kite', article: 'a', pic: 'obj:kite', say: A("It's a kite.") },
  { noun: 'ugly monster', article: 'an', pic: 'obj:monster', say: A("It's an ugly monster.") },
  { noun: 'doll', article: 'a', pic: 'obj:doll', say: A("It's a doll.") },
]

export const buildItems: { words: string[]; pic?: string; say: string }[] = [
  { words: ['It', 'is', 'a', 'train', '.'], pic: 'obj:train', say: A('It is a train.') },
  { words: ['Is', 'it', 'a', 'doll', '?'], pic: 'obj:doll', say: A('Is it a doll?') },
  { words: ['No', ',', 'it', "isn't", '.'], pic: 'obj:car', say: NO },
  { words: ["It's", 'a', 'go-kart', '.'], pic: 'obj:go-kart', say: A("It's a go-kart.") },
]

function yn(shown: string, asked: string): ChoiceRound {
  const yes = shown === asked
  const a = word(asked)
  return {
    id: `yn-${asked}-${yes ? 'yes' : 'no'}`,
    topic: 'yes-no',
    skill: 'grammar',
    prompt: L(`Is it ${a.article} ${a.en}?`, `Bu bir ${a.tr} mı?`),
    visual: { type: 'object', pic: `obj:${shown}` },
    options: [
      { id: 'yes', label: YES, correct: yes, say: YES },
      { id: 'no', label: NO, correct: !yes, say: NO },
    ],
    hint: L('Look at the picture. Is it the same thing?', 'Resme bak. Aynı şey mi?'),
    speak: { accept: yes ? ['yes it is'] : ['no it is not'], rivals: [yes ? 'no' : 'yes'] },
    layout: 'sentences',
  }
}
export const yesNoRounds: ChoiceRound[] = [yn('ball', 'ball'), yn('kite', 'ball'), yn('plane', 'plane'), yn('train', 'car'), yn('doll', 'doll')]

export const itsCheckRound: ChoiceRound = {
  id: 'its-short',
  topic: 'contractions',
  skill: 'grammar',
  prompt: L4.itsCheck,
  visual: { type: 'none' },
  options: [
    { id: 'its', label: A("It's a doll."), correct: true, say: A("It's a doll.") },
    { id: 'is', label: 'Is a doll.', correct: false },
    { id: 'it', label: 'It a doll.', correct: false },
  ],
  hint: L('The short form keeps "It" and adds a little mark.', 'Kısa hal "It" kelimesini korur ve küçük bir işaret ekler.'),
  layout: 'sentences',
}
export const isntCheckRound: ChoiceRound = {
  id: 'isnt-short',
  topic: 'contractions',
  skill: 'grammar',
  prompt: L('Which one means the same as: It is not a car?', '"It is not a car" ile aynı anlama gelen hangisi?'),
  visual: { type: 'none' },
  options: [
    { id: 'isnt', label: A("It isn't a car."), correct: true, say: A("It isn't a car.") },
    { id: 'is', label: A('It is a car.'), correct: false },
    { id: 'isit', label: A('Is it a car?'), correct: false },
  ],
  hint: L('Not becomes n apostrophe t: isn\'t.', 'Not kelimesi n kesme t olur: isn\'t.'),
  layout: 'sentences',
}
