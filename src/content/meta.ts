/** Level metadata: names, places, rewards. Add a future unit by adding an entry here + its level component. */
import { L, type Line } from './lines'

export type LevelKey = 'warmup' | 'detective' | 'toyshop' | 'grammar' | 'tennis'

export interface LevelMeta {
  id: LevelKey
  num: number
  title: string
  place: string
  name: Line
  reward: string
  rewardLine: Line
  icon: 'backpack' | 'message' | 'toy' | 'wand' | 'trophy'
  colour: string
}

export const LEVELS: LevelMeta[] = [
  {
    id: 'warmup', num: 1, title: 'Warm-Up!', place: 'Classroom',
    name: L('Level one: Warm-Up! In the classroom.', 'Birinci bölüm: Isınma! Sınıfta.'),
    reward: 'Warm-Up Star', rewardLine: L('You earned the Warm-Up Star!', 'Isınma Yıldızını kazandın!'),
    icon: 'backpack', colour: '#3a9d98',
  },
  {
    id: 'detective', num: 2, title: 'Speak & Understand!', place: 'English Detective',
    name: L('Level two: Speak and Understand! Be an English detective.', 'İkinci bölüm: Konuş ve Anla! İngilizce dedektifi ol.'),
    reward: 'English Detective Badge', rewardLine: L('You earned the English Detective Badge!', 'İngilizce Dedektif Rozetini kazandın!'),
    icon: 'message', colour: '#5b8fd6',
  },
  {
    id: 'toyshop', num: 3, title: 'Toy Shop Adventure!', place: 'Toy Shop',
    name: L('Level three: Toy Shop Adventure!', 'Üçüncü bölüm: Oyuncak Dükkânı Macerası!'),
    reward: 'Toy Explorer Badge', rewardLine: L('You earned the Toy Explorer Badge!', 'Oyuncak Kâşifi Rozetini kazandın!'),
    icon: 'toy', colour: '#e58fb0',
  },
  {
    id: 'grammar', num: 4, title: 'Sentence Magic!', place: 'Grammar Room',
    name: L('Level four: Sentence Magic! In the Grammar Room.', 'Dördüncü bölüm: Cümle Sihri! Dilbilgisi Odasında.'),
    reward: 'Sentence Wizard Badge', rewardLine: L('You earned the Sentence Wizard Badge!', 'Cümle Büyücüsü Rozetini kazandın!'),
    icon: 'wand', colour: '#8f74c9',
  },
  {
    id: 'tennis', num: 5, title: 'Tennis Challenge!', place: 'Final Tournament',
    name: L('Level five: the Tennis Challenge! The final tournament.', 'Beşinci bölüm: Tenis Mücadelesi! Final turnuvası.'),
    reward: 'English Tennis Cup', rewardLine: L('You won the English Tennis Cup!', 'İngilizce Tenis Kupasını kazandın!'),
    icon: 'trophy', colour: '#e0a72e',
  },
]
export const levelMeta = (id: LevelKey) => LEVELS.find((l) => l.id === id)!
