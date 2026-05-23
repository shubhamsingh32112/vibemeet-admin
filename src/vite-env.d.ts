/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  /** Optional — deprecated; media uses Cloudflare Images, not Firebase Storage. */
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  /** Optional: INR per wallet coin for dashboard leaderboard money columns (display only). */
  readonly VITE_DASHBOARD_INR_PER_COIN?: string
  /** Optional: base URL for agency referral join links (default https://matchvibe.co.in/join). */
  readonly VITE_REFERRAL_JOIN_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}