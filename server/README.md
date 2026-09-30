# QuickStay API

Express + PostgreSQL API for the QuickStay hotel booking platform.

## Run locally

```bash
cd server
cp .env.example .env      # point DATABASE_URL at a local Postgres
npm install
npm run dev               # migrates, seeds demo data on an empty DB, starts on :4000
npm test                  # API tests (uses the quickstay_test database)
```

Demo accounts (password `password123`): `guest@quickstay.app` and `owner@quickstay.app`.

## Structure

- `db/migrations/*.sql` – schema, applied in order on boot (`npm run migrate`)
- `db/seed.js` – demo hotels, rooms, bookings, reviews and promo codes
- `lib/bookings.js` – availability, pricing and the booking lifecycle
- `routes/` – HTTP endpoints

## Endpoints

| Area | Endpoints |
|---|---|
| Public | `GET /api/health`, `/api/config`, `/api/stats`, `/api/cities`, `/api/offers`, `POST /api/newsletter` |
| Rooms | `GET /api/rooms` (search: destination, dates, guests, price, type, amenities, sort, page), `/api/rooms/featured`, `/api/rooms/filters`, `/api/rooms/:id`, `/:id/similar`, `/:id/quote`, `/:id/reviews`, `POST /:id/reviews` |
| Auth | `POST /api/auth/register`, `/login`, `/forgot-password`, `/reset-password`; `GET/PATCH /api/auth/me`, `POST /api/auth/me/password` |
| Bookings | `POST /api/bookings`, `GET /api/bookings/mine`, `GET /api/bookings/:id`, `POST /:id/cancel`, `POST /:id/pay` |
| Payments | `POST /api/payments/webhook` (Stripe), `GET /api/payments/verify` |
| Wishlist | `GET /api/wishlist`, `/api/wishlist/ids`, `PUT/DELETE /api/wishlist/:roomId` |
| Uploads | `POST /api/uploads` (multipart `images`), `GET /api/uploads/:id` |
| Owner | `GET/POST /api/owner/hotels`, `PATCH/DELETE /api/owner/hotels/:id`, `GET/POST /api/owner/rooms`, `PATCH/DELETE /api/owner/rooms/:id`, `GET /api/owner/bookings`, `PATCH /api/owner/bookings/:id`, `GET /api/owner/stats` |

## How bookings work

- Prices are always computed on the server: nights × rate, minus promo, plus tax.
- Each room type has `total_units`. A booking is accepted only while overlapping
  active bookings are below that number. The room row is locked (`SELECT … FOR UPDATE`)
  during the check, so two guests can't take the last unit at the same time.
- Pay at hotel → `confirmed` immediately. Card → `pending`, holding the room for
  30 minutes until Stripe confirms payment (webhook or the success-page verify call).
- Cancelling a paid card booking refunds it through Stripe.
