# My English Tennis Adventure

A voice-guided English learning game for a 7–8-year-old learner (Cambridge Super Minds 1: Starter, Unit 1 *At school*, Unit 2 *Let's play!*).
The player (Alya) completes four learning challenges with her Teacher, then plays a tennis match against her on a side-view court.

## Run it

```bash
cd tennis-adventure
npm install
npm run dev          # http://localhost:5180
```

Production build (static files in `dist/`, can be hosted anywhere or opened through any static web server):

```bash
npm run build
npm run preview      # http://localhost:4173
```

Requirements: Node 18+. Python + `pillow numpy scipy edge-tts` are only needed to regenerate assets or voices (see below).

## Project structure

```
assets-src/            original supplied images (never modified)
public/assets/         game-ready images made by tools/prepare_assets.py
  backgrounds/<scene>/ map, classroom, toy-shop, grammar-room, tennis-court (1600x900 WebP)
  characters/alya|teacher/  8 poses each, transparent WebP
  objects/school|toys/      individual transparent sprites
public/audio/voice/    578 pre-recorded voice clips + manifest.json
src/
  assets/manifest.ts   asset ids + scene coordinates (map markers, scoreboard, court, shop zones)
  store/gameStore.ts   settings, progress, attempt log, review queue (persisted in localStorage)
  audio/voice.ts       speech output service (clips -> browser TTS fallback, cancel, ducking)
  audio/sfx.ts         Web Audio sound effects + gentle background music
  speech/recognition.ts  Web Speech API wrapper (errors, timeout, abort)
  speech/match.ts      answer normalisation + matching (contractions, numbers, aliases, rivals)
  content/             ALL educational content as structured data (see "Adding content")
  components/          Stage (scaled 1600x900 coordinate system), Character, Guide (teacher bubble),
                       ChoiceActivity (activity engine), Drag (drag & drop + tap fallback),
                       SentenceBuilder, Mic, Effects (confetti, badges, trophy), LevelShell
  levels/Level1..5.tsx the five levels
  screens/             Welcome, Menu, Map, Rewards, Settings, TeacherMode
tools/
  prepare_assets.py    crops/cut-outs/optimisation, writes contact sheets to tools/out/
  gen_voices.py        records voice clips with edge-tts
scripts/export-lines.ts  lists every spoken line from src/content
```

## Levels

| # | Level | Place | Mechanics |
|---|-------|-------|-----------|
| 1 | Warm-Up! | supplied classroom | Colour Hunt (colour + object), Count and Say (tap to count, tap or say the number), Pack Your School Bag (drag & drop / tap-tap), What's this? / Is it a…? (full-sentence answers, one spoken), Meet Your Teacher (name + age, any valid answer accepted) |
| 2 | Speak & Understand | campus map, blurred, as "detective" scene | Question Detective (What/Where/Who/Which/When teaching cards + answer-type matching + "which question word is missing?"), Listen and Do (pass the pencil to Teacher's hand, look at me, open/close the book, call Teacher back), English or Turkish? (audio-only phrases incl. *Look!* vs *Cool!*), What About You? (personal answers, all valid ones accepted) |
| 3 | Toy Shop Adventure | supplied toy shop | Explore (10 independent toy sprites placed in the shop: name, sentence, Turkish help, "say it too" mic), Listen and Find, Memory Cards (picture ↔ word), Organize the shop (shelf / counter / rug drop zones), Speaking Challenge (single word accepted as an early step for the first two, full sentence required afterwards) |
| 4 | Sentence Magic | supplied colourful Grammar Room | It is → Is it (animated word blocks + build it yourself), It's = It is, isn't = is not (animated contractions, long/short toggle, same meaning), Yes/No (✓/✗ icons, not colour only), a / an (drag the article into the gap), Build a Sentence (word tiles) |
| 5 | Tennis Challenge | supplied side-view court | See below |

Rewards: Warm-Up Star, English Detective Badge, Toy Explorer Badge, Sentence Wizard Badge, English Tennis Cup. On the map the levels follow the path from right to left, then up to the school. Levels unlock in order; the tennis final opens after the four learning areas. Progress inside a level is saved per activity ("Continue").

### Tennis rules (documented simplification)
- Alya (left) and Teacher (right) are separate sprite layers facing each other; the ball is a separate animated object with a shadow, arcing over the net and bouncing once on each side.
- Each point is a rally: the ball freezes beside Alya and a question appears. **2 correct answers win the point.**
- Question types mix: toy and school-object identification, listen-and-choose pictures, yes/no, question words, a/an, isn't, word order, speaking.
- A wrong tap answer (or wrong word order): Teacher says "Oh no!", the right answer turns green and is spoken, and the Teacher wins the point. The missed item goes into the review queue.
- Speaking questions never give the Teacher a point, so microphone problems are never punished.
- The Teacher's score stops at 40 and there is no deuce, so the child always wins with sustained effort.
- Score: 0 → 15 → 30 → 40 → Game, drawn by code over the blank areas of the painted scoreboard.
- Questions missed earlier anywhere in the game come first in the match (adaptive review).

## Asset integration

All visuals come from the supplied artwork:
- **Alya** and **Teacher** sheets were split into 8 poses each (idle, happy, thinking, sad, celebrate, swing, ready, wave). The white sheet background was removed with a border flood-fill plus removal of enclosed gaps (between legs/arms); grey floor shadows became real translucent shadows. The tennis ball painted into the swing poses was erased because the game animates its own ball. Contact sheets on dark/green/pink backdrops were inspected (`tools/out/contact_*.png`).
- **School objects** (pen, rubber, pencil, book, notebook, bag, desk, ruler, pencil case; chair and board as extras) and **toys** (kite, doll, monster, plane, computer game, train, car, ball, bike, go-kart) were cropped without their text labels and cut out individually.
- **Backgrounds**: map, classroom, toy shop, colourful grammar room and side-view tennis court. Four images carried a screenshot UI strip at the top (menu icons, "New se…", ×); it was cropped off, keeping 16:9.
- Colour Hunt colour variants are CSS hue filters of the supplied purple objects (the yellow pencil is used as is).
- Small original SVG props were drawn only where no artwork existed: tennis ball, rackets (Which?), morning/evening sky cards (When?), apple and orange (a/an), trophy and badges.
- Not used: the older reference image of a girl with a visor (it matches neither character), and the textbook screenshots (curriculum reference only, no textbook content is reproduced).

## Audio and microphone

**Voice output**: every instruction, hint, praise and model answer is pre-recorded (offline in the game):
Teacher = `en-GB-LibbyNeural` (warm British female, slightly slow), Alya's model answers = `en-GB-MaisieNeural` (British child), Turkish help = `tr-TR-EmelNeural`.
Lines that contain the player's own name are recorded for "Alya"; for other names the browser's SpeechSynthesis (en-GB voice if available) says that line. Missing/failed clips also fall back to SpeechSynthesis. Only one line plays at a time; changing screens cancels speech; music ducks automatically during speech. Every instruction has a replay button; the TR button shows and speaks the Turkish meaning on request.

Regenerate voices after editing content: `npm run voices` (needs internet while recording).

**Speech recognition**: browser Web Speech API, `en-GB`, 5 alternatives, 7 s timeout.
- Supported: Chrome, Edge (desktop/Android), Safari 14.1+. Not supported: Firefox → the mic shows a message and tap-to-answer is offered.
- **Privacy**: in Chrome/Edge the spoken audio is sent to Google/Microsoft for transcription. The game therefore asks for **grown-up consent** before the first use (Settings → "Speaking with the microphone"). The game itself never records, stores or uploads audio; only the recognised text is compared and a short result ("correct", "different answer", "not heard") is kept for the teacher.
- Matching normalises case, punctuation, contractions (it's/it is, isn't/is not, I'm), numbers (7/seven), filler words and a small alias list (eraser→rubber, bicycle→bike, go cart→go-kart). A *different* object ("It's a car" for a kite) is rejected; unclear or empty results are never counted as wrong.
- No pronunciation scores are shown: speech-to-text cannot judge pronunciation. Feedback says "Answer recognized!" or "Let's listen again!".
- Every speaking task has a "tap the answer" alternative, so the child can never get stuck.

## Teacher Mode

Menu → small "Teacher Mode" link (bottom right). Default PIN **1234** (change it inside the dashboard). The PIN is only a barrier for little hands, not security: all data lives in this browser's localStorage.
Shows: display name, completed levels, answers, correct first try / after a hint / after several tries / answer shown, wrong attempts, per-skill and per-topic results, vocabulary per word, speaking attempts by outcome (incl. "answered by tapping"), time practising, last practice, automatic insights ("Needs more practice: …", "Going well: …") and the review queue. Export (JSON) and Reset buttons. Only real gameplay data is shown.

## Adding content

All content is data in `src/content/`:
- `vocab.ts` – words (English, Turkish, accepted alternatives). A new word needs a sprite in `public/assets/objects/...`.
- `level1.ts … level4.ts`, `tennis.ts` – rounds (`ChoiceRound`: prompt, Turkish help, visual, options, hint, accepted spoken answers).
- `meta.ts` – level list, names, rewards.
New rounds automatically work with the activity engine, progress tracking, the review queue and the teacher dashboard. Run `npm run voices` to record new lines. A future unit = new content file + a level component (copy an existing `levels/LevelN.tsx`) + an entry in `meta.ts` and a marker position in `assets/manifest.ts`.

## Supported browsers / devices
Latest Chrome, Edge, Safari, Firefox (no speech recognition in Firefox). Desktop and tablets in landscape; phones work but are small (a "turn sideways" hint appears in portrait). The game is laid out on a fixed 1600×900 stage scaled to fit, so artwork is never stretched and overlays stay aligned.

## Tests performed (in the built-in browser)
- First launch: name entry with a custom name, saved, greeting uses it, map opens; returning visit shows the menu.
- Map: 5 markers on the path, locked/available/completed states, locked explanation; marker position measured at 1024×768 = exactly its stage coordinate; no horizontal overflow; portrait hint at 375×812.
- Level 1: colour hunt (wrong + right, hint, re-queued item), count, drag-and-drop and tap-tap into the bag, What's this?, Meet Your Teacher.
- Level 2: teaching cards, What/Where screens, all 5 Listen-and-Do actions (drag pencil to hand, tap teacher, open/close book, call back).
- Level 3: explore toys, memory flip, organize drag to shelf, speaking screen with mic consent dialog and tap fallback.
- Level 4: statement→question animation, sentence builder (wrong order feedback + correct), short/long form toggle, a/an drag.
- Level 5: two complete matches with an automated player (dev-only DOM hook): serve/rally/winner animations, wrong-answer pause and hints, score updates to Game, victory screen; review items from the first match came first in the second.
- Teacher dashboard with real recorded data. TypeScript build passes. Production build loads with no console errors.

**Not verified**: live microphone recognition with real speech (no microphone in the test environment – only the consent dialog, unsupported/fallback paths and the matching code path were exercised); audio was verified by network requests for the clips, not by listening; every single round of every activity was not played by hand (English-or-Turkish, What-about-you, Yes/No and Build were checked through the shared engine only); Safari/iPad not tested.

## Known limitations
- Tailwind CSS was planned but its Vite plugin (4.0.6) crashes on this folder path (non-ASCII "Masaüstü"), so styling uses plain CSS with design tokens. Phaser was not needed: the tennis animation is custom requestAnimationFrame code.
- Pose-based animation (cross-fades and small transforms), not frame-by-frame animation – there are only 8 poses per character.
- Names other than "Alya" are spoken by the browser voice in name lines.
- Speech recognition quality depends on the browser and its cloud service; children's voices are recognised less reliably than adults'.
- Teacher content editing is through the data files, not an in-app editor.
