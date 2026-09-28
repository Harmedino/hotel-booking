# Deploying

Repo: https://github.com/Harmedino/hotel-booking

- **Frontend** (`client/`) → Vercel
- **Backend** (`server/`) → Render

Deploy the backend first — the frontend needs its URL.

## 1. Backend on Render
**New → Web Service** → pick `Harmedino/hotel-booking`, then:

| Setting | Value |
|---|---|
| Branch | `master` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Instance Type | Free |
| Health Check Path | `/api/health` |

Environment variables: `NODE_VERSION` = `20`. Leave `CLIENT_URL` unset for now.

Deploy, copy the URL (e.g. `https://hotel-booking-api.onrender.com`), and check
`<url>/api/health` returns `{"status":"ok"}`.

## 2. Frontend on Vercel
**Add New → Project** → import `Harmedino/hotel-booking`, then:

| Setting | Value |
|---|---|
| Framework Preset | Vite |
| Root Directory | `client` |
| Build Command | `npm run build` (default) |
| Output Directory | `dist` (default) |

Environment variable: `VITE_API_URL` = your Render URL (no trailing slash).

Deploy and copy the Vercel URL. `client/vercel.json` makes deep links like `/rooms/r1` work on refresh.

## 3. Connect them
Back on Render → your service → **Environment** → add
`CLIENT_URL` = your Vercel URL (no trailing slash). Save; Render redeploys.
Comma-separate to allow several origins (e.g. a custom domain).

## Gotchas
- `VITE_API_URL` is baked in at build time. Change it → **redeploy** on Vercel.
- CORS error in the browser console → `CLIENT_URL` on Render doesn't exactly match the Vercel URL.
- Render free tier sleeps after ~15 min idle; first request takes ~30–50s.
- Data is in memory (`server/data/store.js`) — bookings reset on every restart/redeploy.
