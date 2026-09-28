# Deploying

Both apps deploy to [Render](https://render.com) from `render.yaml` (free tier).

1. Push this branch, then in Render: **New → Blueprint** → pick this repo.
   It creates `hotel-booking-api` (Express) and `hotel-booking-client` (static site).
2. When prompted for env vars:
   - `hotel-booking-client` → `VITE_API_URL` = `https://hotel-booking-api.onrender.com`
   - `hotel-booking-api` → `CLIENT_URL` = `https://hotel-booking-client.onrender.com`
   (use the real URLs Render shows you; no trailing slash)
3. `VITE_API_URL` is baked in at build time — if you change it, redeploy the client.

Check: `https://<api-url>/api/health` should return `{"status":"ok"}`.

## Alternative: frontend on Vercel
Import the repo, set **Root Directory** = `client`, add `VITE_API_URL`.
`client/vercel.json` handles React Router deep links. Add the Vercel URL to the API's `CLIENT_URL`
(comma-separate multiple origins).

## Caveats
- Free Render services sleep after ~15 min idle; first request takes ~30–50s.
- Data lives in memory (`server/data/store.js`) — bookings are wiped on every restart/redeploy.
  Swap in a real DB (e.g. MongoDB Atlas / Postgres) before real users touch it.
