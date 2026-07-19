import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/context/ToastContext'
import { WalletProvider } from '@/context/WalletContext'
import App from '@/App'
import '@/index.css'

/** Nova owns production root at novablockchain.it.com — separate from Signet at /signet/ */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <WalletProvider>
          <App />
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
