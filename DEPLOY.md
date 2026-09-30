# Deploying

Repo: https://github.com/Harmedino/hotel-booking

- **Database** → MongoDB Atlas (free M0 cluster)
- **Backend** (`server/`) → Render
- **Frontend** (`client/`) → Vercel

## 1. Database
Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas), then:
- **Database Access** → add a user with a password.
- **Network Access** → allow `0.0.0.0/0` (Render's IPs aren't fixed).
- **Connect → Drivers** → copy the `mongodb+srv://…` string, put your password in, and add
  the database name before the `?`, e.g. `…mongodb.net/quickstay?retryWrites=true&w=majority`.

Collections, indexes and demo data are created automatically the first time the API starts.

## 2. Backend on Render
**New → Web Service** → pick `Harmedino/hotel-booking`:

| Setting | Value |
|---|---|
| Branch | `master` |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` (runs `node index.js`; there is no `dist/` build output) |
| Health Check Path | `/api/health` |

Environment variables:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas connection string |
| `JWT_SECRET` | 32+ random characters (`openssl rand -hex 32`); weak values like `change-me` are rejected |
| `CLIENT_URL` | Vercel URL, no trailing slash (add after step 3) |
| `APP_URL` | same as `CLIENT_URL` |
| `SEED_ON_EMPTY` | optional: `true` seeds demo hotels and demo logins into an empty database once; never touches existing data |
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
- The API refuses to start with a clear list of problems if a required variable is missing, weak, or still points at localhost.
- `VITE_API_URL` is baked in at build time. Change it → **redeploy** on Vercel.
- CORS error in the browser → `CLIENT_URL` doesn't exactly match the Vercel URL.
- Render free tier sleeps after ~15 min idle; the first request takes ~30–50s.
- Without Stripe keys, guests can still book with "Pay at hotel".
- Without SMTP, emails are skipped (logged instead); everything else works.
