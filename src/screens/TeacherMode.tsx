import { useMemo, useState } from 'react'
import { ArrowLeft, Lock, Download, RotateCcw, CheckCircle2, Circle } from 'lucide-react'
import { useStage } from '../components/Stage'
import { useGame, LEVEL_ORDER, type Attempt, reviewKeys } from '../store/gameStore'
import { LEVELS } from '../content/meta'
import { ALL_WORDS } from '../content/vocab'

const TOPIC_LABEL: Record<string, string> = {
  colours: 'Colours',
  numbers: 'Numbers 1–10',
  'school-objects': 'School objects (What’s this? – It’s a…)',
  'is-it': 'Is it a…? – Yes, it is / No, it isn’t',
  greetings: 'Greetings & introductions',
  'pack-bag': 'Instructions: Put the … in the bag',
  'question-words': 'Question words (What/Where/Who/Which/When)',
  'listen-do': 'Listen and do (classroom instructions)',
  phrases: 'Everyday phrases (Look!, Listen!, Thank you…)',
  'what-about-you': 'What about you? (personal answers)',
  toys: 'Toy vocabulary',
  'toys-listen': 'Listening: toy words',
  'listening-words': 'Listening: words',
  memory: 'Memory cards (word ↔ picture)',
  organize: 'Instructions: Put the … on the …',
  'toy-speaking': 'Speaking: It’s a …',
  'word-order': 'Word order / questions',
  contractions: 'Short forms (It’s, isn’t)',
  'yes-no': 'Yes, it is / No, it isn’t',
  articles: 'a / an',
  tennis: 'Tennis match questions',
}
const label = (t: string) => TOPIC_LABEL[t] ?? t

function pct(n: number, d: number) {
  return d ? Math.round((n / d) * 100) : 0
}

function Bar({ value, color = '#3a9d98' }: { value: number; color?: string }) {
  return (
    <div style={{ height: 14, background: '#efe6d3', borderRadius: 8, overflow: 'hidden', width: 180 }}>
      <div style={{ width: `${value}%`, height: '100%', background: color }} />
    </div>
  )
}

function Pin({ onOk }: { onOk: () => void }) {
  const pin = useGame((s) => s.teacherPin)
  const go = useGame((s) => s.go)
  const [v, setV] = useState('')
  const [bad, setBad] = useState(false)
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#245d61', display: 'grid', placeItems: 'center' }}>
      <form
        className="panel"
        style={{ width: 620, padding: 40, textAlign: 'center' }}
        onSubmit={(e) => {
          e.preventDefault()
          if (v === pin) onOk()
          else setBad(true)
        }}
      >
        <Lock size={54} color="#245d61" />
        <div className="title-font" style={{ fontSize: 44, fontWeight: 700, color: '#245d61' }}>Teacher Mode</div>
        <p style={{ fontSize: 20, color: '#7a6a55' }}>
          Enter the teacher PIN (default <b>1234</b> – change it inside). This PIN is only a casual barrier for little hands, not real security:
          all data stays in this browser.
        </p>
        <input
          className="name-input"
          type="password"
          inputMode="numeric"
          autoFocus
          value={v}
          onChange={(e) => {
            setV(e.target.value)
            setBad(false)
          }}
          aria-label="PIN"
          style={{ fontSize: 40, padding: '8px 20px', width: 240, textAlign: 'center' }}
        />
        {bad && <div style={{ color: '#c0392b', fontWeight: 800, fontSize: 20, marginTop: 8 }}>Wrong PIN</div>}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 20 }}>
          <button type="button" className="btn btn-cream title-font" style={{ fontSize: 26, padding: '10px 26px' }} onClick={() => go({ name: 'menu' })}>
            Back
          </button>
          <button type="submit" className="btn btn-teal title-font" style={{ fontSize: 26, padding: '10px 34px' }}>
            Open
          </button>
        </div>
      </form>
    </div>
  )
}

export function TeacherMode() {
  const [open, setOpen] = useState(false)
  const st = useGame()
  const data = useMemo(() => analyse(st.attempts), [st.attempts])
  const { portrait: P } = useStage()
  if (!open) return <Pin onOk={() => setOpen(true)} />

  const speech = st.speech
  const sp = {
    total: speech.length,
    correct: speech.filter((s) => s.result === 'correct').length,
    partial: speech.filter((s) => s.result === 'partial').length,
    other: speech.filter((s) => s.result === 'other-answer').length,
    unclear: speech.filter((s) => s.result === 'unclear' || s.result === 'error').length,
    manual: speech.filter((s) => s.result === 'manual').length,
  }
  const mins = Math.round(st.timeSpentMs / 60000)
  const review = reviewKeys(st.review)

  const card: React.CSSProperties = { background: '#fffaf0', borderRadius: 20, padding: '16px 20px', border: '3px solid #f0e4cc' }
  const h: React.CSSProperties = { fontFamily: 'Fredoka', fontSize: 24, fontWeight: 600, color: '#245d61', margin: '0 0 8px' }
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#e9f4f1', overflowY: 'auto', padding: '24px 36px', fontSize: 19, color: '#23464a' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 16 }}>
        <button className="btn btn-cream title-font" style={{ fontSize: 24, padding: '8px 22px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => st.go({ name: 'menu' })}>
          <ArrowLeft size={24} /> Exit
        </button>
        <div className="title-font" style={{ fontSize: 40, fontWeight: 700, color: '#245d61' }}>Teacher Dashboard – {st.playerName ?? '—'}</div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <button
            className="btn btn-mint title-font"
            style={{ fontSize: 20, padding: '8px 18px', display: 'flex', gap: 6, alignItems: 'center' }}
            onClick={() => {
              const blob = new Blob([JSON.stringify({ name: st.playerName, completed: st.completed, attempts: st.attempts, speech: st.speech, timeSpentMs: st.timeSpentMs }, null, 1)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = 'english-tennis-progress.json'
              a.click()
            }}
          >
            <Download size={20} /> Export
          </button>
          <button
            className="btn btn-pink title-font"
            style={{ fontSize: 20, padding: '8px 18px', display: 'flex', gap: 6, alignItems: 'center' }}
            onClick={() => {
              if (confirm('Reset all progress, rewards and statistics? This cannot be undone.')) st.resetProgress()
            }}
          >
            <RotateCcw size={20} /> Reset progress
          </button>
        </div>
      </div>

      {st.attempts.length === 0 && (
        <div style={{ ...card, marginBottom: 16, fontWeight: 700 }}>No activity recorded yet. Data appears here as soon as the student plays.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: P ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={h}>Overview</div>
          <div>Activities answered: <b>{data.total}</b></div>
          <div>Correct first try: <b>{data.first}</b> ({pct(data.first, data.total)}%)</div>
          <div>Correct after a hint: <b>{data.hint}</b></div>
          <div>Several attempts: <b>{data.retry}</b></div>
          <div>Answer shown: <b>{data.revealed}</b></div>
          <div>Wrong attempts (total): <b>{data.misses}</b></div>
        </div>
        <div style={card}>
          <div style={h}>Time</div>
          <div>Time practising: <b>{mins} min</b></div>
          <div>Last practice: <b>{st.lastPlayed ? new Date(st.lastPlayed).toLocaleString() : '—'}</b></div>
        </div>
        <div style={card}>
          <div style={h}>Levels</div>
          {LEVELS.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {st.completed[l.id] ? <CheckCircle2 size={20} color="#3fae6a" /> : <Circle size={20} color="#b9b3a6" />} {l.num}. {l.title}
            </div>
          ))}
        </div>
        <div style={card}>
          <div style={h}>Speaking attempts</div>
          <div>Total: <b>{sp.total}</b></div>
          <div>Recognised correct: <b>{sp.correct}</b></div>
          <div>Single word only: <b>{sp.partial}</b></div>
          <div>Different answer heard: <b>{sp.other}</b></div>
          <div>Not heard / mic errors: <b>{sp.unclear}</b></div>
          <div>Answered by tapping instead: <b>{sp.manual}</b></div>
          <div style={{ fontSize: 15, color: '#7a6a55', marginTop: 4 }}>Speech recognition checks the words, not pronunciation quality.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: P ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div style={card}>
          <div style={h}>Teaching insights</div>
          {data.insights.length === 0 && <div>Not enough data yet (insights appear after a few answers per topic).</div>}
          {data.insights.map((s) => (
            <div key={s.text} style={{ fontWeight: 700, color: s.kind === 'review' ? '#b5651d' : '#2e8b57', margin: '4px 0' }}>
              {s.kind === 'review' ? '• Needs more practice: ' : '• Going well: '}
              {s.text}
            </div>
          ))}
          {review.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <b>Items to review</b> (these come back automatically in later activities and the tennis match):
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {review.slice(0, 18).map((k) => (
                  <span key={k} style={{ background: '#fde3cf', borderRadius: 10, padding: '2px 10px' }}>
                    {k.split(':')[1]} <span style={{ color: '#7a6a55' }}>({label(k.split(':')[0]).split(' (')[0]})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={card}>
          <div style={h}>By skill (correct on first try)</div>
          {(['vocabulary', 'listening', 'speaking', 'grammar'] as const).map((k) => {
            const s = data.bySkill[k] ?? { n: 0, first: 0 }
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' }}>
                <span style={{ width: 120, textTransform: 'capitalize', fontWeight: 700 }}>{k}</span>
                <Bar value={pct(s.first, s.n)} />
                <span>
                  {pct(s.first, s.n)}% <span style={{ color: '#7a6a55' }}>({s.n} answers)</span>
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: P ? '1fr' : '1.2fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={h}>By topic</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7a6a55' }}>
                <th>Topic</th>
                <th>Answers</th>
                <th>1st try</th>
                <th>Hint</th>
                <th>Retry</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.byTopic)
                .sort((a, b) => b[1].n - a[1].n)
                .map(([t, v]) => (
                  <tr key={t} style={{ borderTop: '1px solid #efe6d3' }}>
                    <td>{label(t)}</td>
                    <td>{v.n}</td>
                    <td>{pct(v.first, v.n)}%</td>
                    <td>{v.hint}</td>
                    <td>{v.retry + v.revealed}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={card}>
          <div style={h}>Vocabulary</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 16px' }}>
            {ALL_WORDS.map((w) => {
              const v = data.byWord[w.id]
              return (
                <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{w.en}</span>
                  <span style={{ color: !v ? '#b9b3a6' : pct(v.first, v.n) >= 70 ? '#2e8b57' : '#b5651d', fontWeight: 700 }}>{v ? `${pct(v.first, v.n)}% of ${v.n}` : '—'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ ...card, marginTop: 16 }}>
        <div style={h}>Settings for the teacher</div>
        <PinChange />
        <div style={{ fontSize: 16, color: '#7a6a55', marginTop: 8 }}>
          Content (words, sentences, questions, accepted answers) lives in <code>src/content/*.ts</code> as structured data – see README “Adding content”.
          Completed levels: {LEVEL_ORDER.filter((l) => st.completed[l]).length} / 5.
        </div>
      </div>
    </div>
  )
}

function PinChange() {
  const setPin = useGame((s) => s.setPin)
  const [v, setV] = useState('')
  const [ok, setOk] = useState(false)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      New PIN:
      <input className="name-input" value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, 8))} style={{ fontSize: 22, padding: '4px 12px', width: 140 }} aria-label="New PIN" />
      <button
        className="btn btn-teal"
        style={{ fontSize: 18, padding: '4px 16px' }}
        disabled={v.length < 4}
        onClick={() => {
          setPin(v)
          setV('')
          setOk(true)
        }}
      >
        Save PIN
      </button>
      {ok && <span style={{ color: '#2e8b57', fontWeight: 700 }}>Saved</span>}
    </div>
  )
}

function analyse(attempts: Attempt[]) {
  const r = {
    total: attempts.length,
    first: 0,
    hint: 0,
    retry: 0,
    revealed: 0,
    misses: 0,
    bySkill: {} as Record<string, { n: number; first: number }>,
    byTopic: {} as Record<string, { n: number; first: number; hint: number; retry: number; revealed: number }>,
    byWord: {} as Record<string, { n: number; first: number }>,
    insights: [] as { kind: 'review' | 'good'; text: string }[],
  }
  const wordIds = new Set(ALL_WORDS.map((w) => w.id))
  for (const a of attempts) {
    r[a.outcome]++
    r.misses += a.misses
    const s = (r.bySkill[a.skill] ??= { n: 0, first: 0 })
    s.n++
    if (a.outcome === 'first') s.first++
    const t = (r.byTopic[a.topic] ??= { n: 0, first: 0, hint: 0, retry: 0, revealed: 0 })
    t.n++
    t[a.outcome]++
    if (wordIds.has(a.item)) {
      const w = (r.byWord[a.item] ??= { n: 0, first: 0 })
      w.n++
      if (a.outcome === 'first') w.first++
    }
  }
  for (const [topic, v] of Object.entries(r.byTopic)) {
    const p = pct(v.first, v.n)
    if (v.n >= 3 && p < 70) r.insights.push({ kind: 'review', text: `${label(topic)} (${p}% first try)` })
    else if (v.n >= 4 && p >= 85) r.insights.push({ kind: 'good', text: `${label(topic)} (${p}% first try)` })
  }
  return r
}
