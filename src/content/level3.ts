/** Level 3 – Toy Shop Adventure. Unit 2 toy vocabulary. */
import { L } from './lines'
import { TOYS } from './vocab'

export const L3 = {
  intro: [L('Welcome to the Toy Shop!', 'Oyuncak dükkânına hoş geldin!'), L("Let's learn the names of ten toys!", 'Hadi on oyuncağın adını öğrenelim!')],
  titles: {
    explore: L('Explore the Shop', 'Dükkânı Keşfet'),
    find: L('Listen and Find', 'Dinle ve Bul'),
    memory: L('Memory Cards', 'Hafıza Kartları'),
    organize: L('Organize the Toy Shop', 'Oyuncak Dükkânını Düzenle'),
    speak: L('Speaking Challenge', 'Konuşma Görevi'),
  },
  exploreLead: L('Tap every toy to hear its name!', 'Adını duymak için her oyuncağa dokun!'),
  exploreRepeat: L('Can you say it too? Tap the microphone!', 'Sen de söyleyebilir misin? Mikrofona dokun!'),
  exploreDone: L('You found all ten toys!', 'On oyuncağın hepsini buldun!'),
  findLines: Object.fromEntries(
    TOYS.map((t) => [t.id, L(`Find the ${t.en}!`, `${t.tr[0].toUpperCase() + t.tr.slice(1)} bul!`)]),
  ) as Record<string, ReturnType<typeof L>>,
  findHint: L("Listen again. Look at all the toys!", 'Tekrar dinle. Bütün oyuncaklara bak!'),
  memoryLead: L('Find the pairs! A picture and its word.', 'Eşleri bul! Bir resim ve onun kelimesi.'),
  memoryMatch: L("It's a match!", 'Eşleşti!'),
  organizeLead: L("Let's tidy the shop!", 'Hadi dükkânı toplayalım!'),
  organize: [
    { toy: 'doll', zone: 'shelf', line: L('Put the doll on the shelf!', 'Oyuncak bebeği rafa koy!') },
    { toy: 'ball', zone: 'rug', line: L('Put the ball on the rug!', 'Topu halıya koy!') },
    { toy: 'train', zone: 'counter', line: L('Put the train on the counter!', 'Treni tezgâha koy!') },
    { toy: 'kite', zone: 'shelf', line: L('Put the kite on the shelf!', 'Uçurtmayı rafa koy!') },
    { toy: 'car', zone: 'rug', line: L('Put the car on the rug!', 'Arabayı halıya koy!') },
  ],
  organizeHint: L('Find the right toy, then drag it to the right place.', 'Doğru oyuncağı bul, sonra doğru yere sürükle.'),
  zoneNames: { shelf: L('shelf', 'raf'), counter: L('counter', 'tezgâh'), rug: L('rug', 'halı') },
  speakLead: L("Now it's your turn to speak!", 'Şimdi konuşma sırası sende!'),
  speakFull: L("Now say the whole sentence: It's a ...", 'Şimdi cümlenin tamamını söyle: It’s a ...'),
  speakRounds: [
    { toy: 'car', fullSentence: false },
    { toy: 'kite', fullSentence: false },
    { toy: 'bike', fullSentence: true },
    { toy: 'monster', fullSentence: true },
  ],
}
