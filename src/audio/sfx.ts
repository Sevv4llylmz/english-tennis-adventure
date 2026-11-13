/**
 * Sound effects and background music, synthesised with the Web Audio API
 * (no external files, so nothing can fail to download). Music is a gentle
 * pentatonic loop that automatically ducks while a voice line plays.
 */
import { useGame } from '../store/gameStore'

let ctx: AudioContext | null = null
let sfxGain: GainNode | null = null
let musicGain: GainNode | null = null

function ac() {
  if (!ctx) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
    sfxGain = ctx.createGain()
    sfxGain.connect(ctx.destination)
    musicGain = ctx.createGain()
    musicGain.gain.value = 0
    musicGain.connect(ctx.destination)
  }
  return ctx
}

/**
 * After the microphone was used, phones (and Windows) can leave the browser's audio in a quieter
 * "voice call" mode. Closing the old audio engine and building a fresh one puts the game sounds back
 * on the normal media output at full volume. Music keeps playing (its timer uses the new engine).
 */
export function restoreAudioAfterMic() {
  const old = ctx
  ctx = null
  sfxGain = null
  musicGain = null
  old?.close().catch(() => {})
  const c = ac()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
  music.refresh()
}

/** Call from a user gesture (browser autoplay rules). */
export function unlockAudio() {
  const c = ac()
  if (c && c.state === 'suspended') c.resume().catch(() => {})
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.25, dest?: AudioNode, slideTo?: number) {
  const c = ac()
  if (!c || !sfxGain) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, c.currentTime + start)
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + start + dur)
  g.gain.setValueAtTime(0.0001, c.currentTime + start)
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.015)
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur)
  o.connect(g)
  g.connect(dest ?? sfxGain)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur + 0.05)
}

function noise(start: number, dur: number, vol: number, filterFreq: number) {
  const c = ac()
  if (!c || !sfxGain) return
  const len = Math.floor(c.sampleRate * dur)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
  const src = c.createBufferSource()
  src.buffer = buf
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = filterFreq
  const g = c.createGain()
  g.gain.value = vol
  src.connect(f)
  f.connect(g)
  g.connect(sfxGain)
  src.start(c.currentTime + start)
}

function prep() {
  const c = ac()
  if (!c || !sfxGain) return false
  if (c.state === 'suspended') c.resume().catch(() => {})
  sfxGain.gain.value = useGame.getState().settings.sfxVol
  return sfxGain.gain.value > 0
}

export const sfx = {
  correct() {
    if (!prep()) return
    tone(659, 0, 0.18, 'triangle', 0.22)
    tone(988, 0.1, 0.32, 'triangle', 0.2)
  },
  tryAgain() {
    if (!prep()) return
    tone(392, 0, 0.18, 'sine', 0.16)
    tone(330, 0.14, 0.25, 'sine', 0.14)
  },
  pop() {
    if (!prep()) return
    tone(520, 0, 0.09, 'sine', 0.2, undefined, 900)
  },
  click() {
    if (!prep()) return
    tone(800, 0, 0.05, 'triangle', 0.1)
  },
  flip() {
    if (!prep()) return
    noise(0, 0.12, 0.5, 2400)
  },
  whoosh() {
    if (!prep()) return
    noise(0, 0.35, 0.6, 900)
  },
  hit() {
    if (!prep()) return
    noise(0, 0.08, 1.4, 1600)
    tone(180, 0, 0.12, 'sine', 0.35, undefined, 90)
  },
  bounce() {
    if (!prep()) return
    tone(140, 0, 0.1, 'sine', 0.25, undefined, 80)
  },
  sparkle() {
    if (!prep()) return
    ;[1319, 1568, 1976, 2349].forEach((f, i) => tone(f, i * 0.07, 0.25, 'sine', 0.08))
  },
  drop() {
    if (!prep()) return
    tone(300, 0, 0.12, 'triangle', 0.2, undefined, 600)
  },
  fanfare() {
    if (!prep()) return
    const notes = [523, 659, 784, 1047, 784, 1047]
    const times = [0, 0.15, 0.3, 0.45, 0.7, 0.85]
    notes.forEach((f, i) => {
      tone(f, times[i], i === 5 ? 0.8 : 0.22, 'triangle', 0.2)
      tone(f / 2, times[i], i === 5 ? 0.8 : 0.22, 'sine', 0.1)
    })
    noise(0.85, 0.9, 0.25, 5000)
  },
  levelUp() {
    if (!prep()) return
    ;[523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.09, 0.35, 'triangle', 0.16))
  },
}

// ---------------------------------------------------------------- music
const SCALE = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3]
const PATTERN = [0, 2, 4, 2, 3, 5, 4, 2, 0, 2, 4, 6, 5, 4, 3, 1]
const BASS = [130.8, 98, 110, 87.3]
let musicTimer: number | null = null
let step = 0
let ducked = false

function musicLevel() {
  const s = useGame.getState().settings
  if (!s.musicOn) return 0
  return s.musicVol * 0.22 * (ducked ? 0.25 : 1)
}

export const music = {
  start() {
    const c = ac()
    if (!c || !musicGain || musicTimer !== null) return
    musicGain.gain.setTargetAtTime(musicLevel(), c.currentTime, 0.4)
    const beat = 0.42
    musicTimer = window.setInterval(() => {
      if (!ctx || !musicGain || ctx.state !== 'running') return
      const n = PATTERN[step % PATTERN.length]
      tone(SCALE[n], 0, beat * 1.6, 'sine', 0.35, musicGain)
      if (step % 4 === 0) tone(BASS[(step / 4) % 4], 0, beat * 3.6, 'triangle', 0.3, musicGain)
      step++
    }, 420)
  },
  stop() {
    if (musicTimer !== null) clearInterval(musicTimer)
    musicTimer = null
    if (ctx && musicGain) musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2)
  },
  refresh() {
    if (ctx && musicGain) musicGain.gain.setTargetAtTime(musicLevel(), ctx.currentTime, 0.15)
  },
  duck(on: boolean) {
    ducked = on
    music.refresh()
  },
}
