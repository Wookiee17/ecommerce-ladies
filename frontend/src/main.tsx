import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
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
          <Toaster richColors position="top-right" />
        </TryOnProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)

