import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WalletProvider } from '@/context/WalletContext'
import { ToastProvider } from '@/context/ToastContext'
import App from '@/App'
import '@/index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Root element #root not found')

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
