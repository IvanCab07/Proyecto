import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App.tsx'
import { AppToaster } from './ui/Toast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <AppToaster />
  </StrictMode>,
)
