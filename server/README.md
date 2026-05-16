# Hotel Booking Backend

Lightweight Express backend for local development. Uses an in-memory store for rooms and bookings; replace with a real database for production.

Run:

```bash
cd server
npm install
npm run dev
```

API endpoints:

- `GET /api/health` - health check
- `GET /api/rooms` - list rooms
- `GET /api/rooms/:id` - room details
- `GET /api/bookings` - list bookings
- `POST /api/bookings` - create booking (json body)
- `DELETE /api/bookings/:id` - delete booking
- `POST /api/auth/login` - simple auth stub

Note: This is a dev stub only.
