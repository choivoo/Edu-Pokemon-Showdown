import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import ArtSheet from './dev/ArtSheet'
import MusicLab from './dev/MusicLab'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {location.hash === '#art' ? <ArtSheet /> : location.hash === '#music' ? <MusicLab /> : <App />}
  </StrictMode>,
)
