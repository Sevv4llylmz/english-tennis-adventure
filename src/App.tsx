import { useEffect, useState } from 'react'
import { Stage } from './components/Stage'
import { useGame } from './store/gameStore'
import { preloadAll } from './assets/manifest'
import { loadVoiceManifest, stopVoice } from './audio/voice'
import { music } from './audio/sfx'
import { stopListening } from './speech/recognition'
import { Welcome } from './screens/Welcome'
import { Menu } from './screens/Menu'
import { MapScreen } from './screens/MapScreen'
import { Rewards } from './screens/Rewards'
import { Settings } from './screens/Settings'
import { TeacherMode } from './screens/TeacherMode'
import { Level1 } from './levels/Level1'
import { Level2 } from './levels/Level2'
import { Level3 } from './levels/Level3'
import { Level4 } from './levels/Level4'
import { Level5 } from './levels/Level5'

export default function App() {
  const screen = useGame((s) => s.screen)
  const reducedMotion = useGame((s) => s.settings.reducedMotion)
  const [loaded, setLoaded] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadVoiceManifest()
    preloadAll((d, t) => setLoaded(d / t)).then(() => setReady(true))
    // returning players go straight to the menu
    if (useGame.getState().playerName) useGame.getState().go({ name: 'menu' })
  }, [])

  // stop speech / listening whenever the screen changes
  useEffect(() => {
    stopVoice()
    stopListening()
    music.refresh()
  }, [screen])

  let body: React.ReactNode = null
  if (!ready)
    body = (
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(#a9ddf4, #a8ddc4)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="title-font" style={{ fontSize: 64, fontWeight: 700, color: '#245d61' }}>My English Tennis Adventure</div>
          <div style={{ width: 600, height: 34, borderRadius: 20, background: '#fff', margin: '30px auto', overflow: 'hidden', border: '4px solid #fff' }}>
            <div style={{ width: `${Math.round(loaded * 100)}%`, height: '100%', background: '#3a9d98', transition: 'width 0.2s' }} />
          </div>
          <div className="title-font" style={{ fontSize: 30, color: '#245d61' }}>Loading… {Math.round(loaded * 100)}%</div>
        </div>
      </div>
    )
  else
    switch (screen.name) {
      case 'welcome':
        body = <Welcome />
        break
      case 'menu':
        body = <Menu />
        break
      case 'map':
        body = <MapScreen />
        break
      case 'rewards':
        body = <Rewards />
        break
      case 'settings':
        body = <Settings back={screen.back} />
        break
      case 'teacher':
        body = <TeacherMode />
        break
      case 'level':
        body =
          screen.level === 'warmup' ? <Level1 /> : screen.level === 'detective' ? <Level2 /> : screen.level === 'toyshop' ? <Level3 /> : screen.level === 'grammar' ? <Level4 /> : <Level5 />
        break
    }
  return <Stage reducedMotion={reducedMotion}>{body}</Stage>
}
