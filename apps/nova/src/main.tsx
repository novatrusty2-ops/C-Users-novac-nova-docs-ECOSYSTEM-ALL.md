import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '@/context/ToastContext'
import { WalletProvider } from '@/context/WalletContext'
import { Web3Provider } from '@/context/Web3Context'
import App from '@/App'
import '@/index.css'

/** Production: https://novablockchain.it.com/ */
const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || undefined


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <ToastProvider>
        <WalletProvider>
          <Web3Provider>
            <App />
          </Web3Provider>
        </WalletProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
