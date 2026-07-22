/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOVAPAY_SANDBOX_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
