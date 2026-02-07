import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { TryOnProvider } from './context/TryOnContext.tsx'
import { AuthProvider } from './context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TryOnProvider>
          <App />
        </TryOnProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
