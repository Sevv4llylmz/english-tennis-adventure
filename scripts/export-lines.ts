// Lists every spoken line (teacher / alya / turkish) so tools/gen_voices.py can pre-record them.
import { writeFileSync } from 'node:fs'
import { allLines, UI, WELCOME } from '../src/content/lines'
import '../src/content/vocab'
import { meetRounds } from '../src/content/level1'
import '../src/content/level2'
import '../src/content/level3'
import '../src/content/level4'
import '../src/content/tennis'
import '../src/content/meta'

void UI
void WELCOME
meetRounds('Alya')
const lines = allLines()
writeFileSync('tools/voice-lines.json', JSON.stringify(lines, null, 1))
console.log(`${lines.length} lines written to tools/voice-lines.json`)
