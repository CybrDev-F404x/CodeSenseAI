import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { applyStoredTheme } from './utils/theme'

// Apply the user's last saved theme BEFORE React renders
// to prevent a flash of the default Indigo theme.
applyStoredTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
