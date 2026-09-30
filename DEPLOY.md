# Deploying

Repo: https://github.com/Harmedino/hotel-booking

- **Database** → PostgreSQL (Neon or Supabase free tier)
- **Backend** (`server/`) → Render
- **Frontend** (`client/`) → Vercel

## 1. Database
Create a free Postgres database on [Neon](https://neon.tech) and copy the connection
string (`postgres://…?sslmode=require`). Tables and demo data are created
automatically the first time the API starts.

## 2. Backend on Render
**New → Web Service** → pick `Harmedino/hotel-booking`:

| Setting | Value |
|---|---|
| Branch | `master` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon connection string |
| `JWT_SECRET` | long random string (`openssl rand -hex 32`) |
| `CLIENT_URL` | Vercel URL, no trailing slash (add after step 3) |
| `APP_URL` | same as `CLIENT_URL` |
| `STRIPE_SECRET_KEY` | optional, enables card payments |
| `STRIPE_WEBHOOK_SECRET` | optional, from a Stripe webhook pointing at `<render-url>/api/payments/webhook` (event `checkout.session.completed`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | optional, enables emails |

Check `<render-url>/api/health` returns `{"status":"ok"}`.

## 3. Frontend on Vercel
**Add New → Project** → import `Harmedino/hotel-booking`, Framework **Vite**, Root Directory `client`.

Environment variable: `VITE_API_URL` = your Render URL (no trailing slash).

## 4. Connect them
Set `CLIENT_URL` and `APP_URL` on Render to the Vercel URL and save (Render redeploys).
Comma-separate `CLIENT_URL` to allow several origins (e.g. a custom domain).

## Gotchas
- `VITE_API_URL` is baked in at build time. Change it → **redeploy** on Vercel.
- CORS error in the browser → `CLIENT_URL` doesn't exactly match the Vercel URL.
- Render free tier sleeps after ~15 min idle; the first request takes ~30–50s.
- Without Stripe keys, guests can still book with "Pay at hotel".
- Without SMTP, emails are skipped (logged instead); everything else works.
