import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// dev-only hook for automated browser testing
if (import.meta.env.DEV) {
  import('./store/gameStore').then((m) => {
    ;(window as unknown as { __game: unknown }).__game = m.useGame
  })
}
