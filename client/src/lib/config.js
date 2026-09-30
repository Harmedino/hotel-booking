// Set VITE_API_URL to the deployed API (e.g. https://hotel-booking-api.onrender.com).
// Production builds refuse to build without it (see vite.config.js); the
// localhost fallback only ever applies to `npm run dev`.
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

// Server-hosted images are stored as paths like /static/... or /api/uploads/...
export function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('/') ? `${API_URL}${path}` : path;
}
