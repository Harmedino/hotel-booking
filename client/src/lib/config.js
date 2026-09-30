export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Server-hosted images are stored as paths like /static/... or /api/uploads/...
export function imageUrl(path) {
  if (!path) return '';
  return path.startsWith('/') ? `${API_URL}${path}` : path;
}
