/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
