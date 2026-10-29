import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { startKeepAlive } from './services/api'

// Inicia ping periódico de keep-alive para evitar cold start
startKeepAlive();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
