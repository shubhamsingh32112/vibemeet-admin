/** Socket.IO connects to the HTTP origin, not `/api/v1`. */
export function getSocketBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
  return raw.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3000';
}
