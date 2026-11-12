"""Pre-record every game line with neural voices (edge-tts) into public/audio/voice.

  teacher -> en-GB-LibbyNeural   (warm British female, slightly slower)
  alya    -> en-GB-MaisieNeural  (British child voice, model answers)
  tr      -> tr-TR-EmelNeural    (Turkish help)

Usage: npm run voices     (needs internet while generating; the game itself works offline)
Already generated clips are reused, so re-running only records new lines.
"""
import asyncio, hashlib, json, sys
from pathlib import Path
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "audio" / "voice"
VOICES = {
    "teacher": ("en-GB-LibbyNeural", "-10%", "+0Hz"),
    "alya": ("en-GB-MaisieNeural", "-8%", "+0Hz"),
    "tr": ("tr-TR-EmelNeural", "-6%", "+0Hz"),
}


async def gen(sem, voice, text, path):
    async with sem:
        name, rate, pitch = VOICES[voice]
        for attempt in range(4):
            try:
                await edge_tts.Communicate(text, name, rate=rate, pitch=pitch).save(str(path))
                return True
            except Exception as e:  # network hiccups
                if attempt == 3:
                    print("FAILED", voice, text, e, file=sys.stderr)
                    return False
                await asyncio.sleep(1.5)


async def main():
    lines = json.loads((ROOT / "tools" / "voice-lines.json").read_text(encoding="utf-8"))
    OUT.mkdir(parents=True, exist_ok=True)
    manifest, jobs = {}, []
    sem = asyncio.Semaphore(6)
    for ln in lines:
        v, t = ln["voice"], ln["text"].strip()
        h = hashlib.sha1(f"{v}|{t}".encode("utf-8")).hexdigest()[:12]
        fn = f"{v[0]}_{h}.mp3"
        manifest[f"{v}|{t}"] = fn
        p = OUT / fn
        if not p.exists() or p.stat().st_size < 800:
            jobs.append(gen(sem, v, t, p))
    print(f"{len(lines)} lines, {len(jobs)} to record")
    res = await asyncio.gather(*jobs)
    for k, fn in list(manifest.items()):
        if not (OUT / fn).exists():
            del manifest[k]
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=0), encoding="utf-8")
    print("recorded", sum(1 for r in res if r), "failed", sum(1 for r in res if not r))


asyncio.run(main())
