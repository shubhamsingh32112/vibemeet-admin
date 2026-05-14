/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  /** Optional: INR per wallet coin for dashboard leaderboard money columns (display only). */
  readonly VITE_DASHBOARD_INR_PER_COIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}