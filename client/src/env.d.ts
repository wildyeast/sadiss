interface ImportMetaEnv {
  readonly VITE_MCORP_API_KEY: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}