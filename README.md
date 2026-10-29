# QuickStay

A hotel-discovery and booking project with a React client and an Express/MongoDB API.

**Frontend:** <https://hotel-booking-eosin-nu.vercel.app>

The code includes room search, guest bookings, saved properties and an owner workspace. Online payments use an optional Stripe integration. Source implementation and a reachable frontend are not proof that every deployed workflow is operational.

## Local development

Use Node.js 22+ and npm, plus a MongoDB replica set. Booking transactions require a replica set; a standalone MongoDB process is insufficient. Use an isolated development/test database.

```sh
# Terminal 1
cd server
npm ci
cp .env.example .env
# Configure your development MongoDB URI and a strong JWT_SECRET locally.
npm run dev

# Terminal 2
cd client
npm ci
cp .env.example .env
npm run dev
```

The API normally uses port 4000 and the Vite frontend port 5173. `VITE_API_URL` configures the client API origin. Keep secrets in server-side environment configuration, never in `VITE_*` variables. For an empty development database, the API can seed demo records; review `SEED_ON_EMPTY` before pointing it at any existing database.

## Architecture

```text
client/          React + Redux Toolkit + Vite
server/routes/   Express endpoint handlers
server/models/   Mongoose schemas
server/lib/      Booking, pricing, authentication and payment helpers
server/test/     Node test-runner API tests
```

The booking engine writes a room-lock field and checks availability inside a MongoDB transaction. Optional Stripe checkout and webhook handling live on the server. These are code observations, not claims that live payment/refund flows were tested.

## Validation

```sh
cd client
npm run build
npm run lint

cd ../server
npm test
```

API tests require a MongoDB replica set and an isolated test database; see [server documentation](server/README.md). Do not point tests at production data. This review inspected the overlapping-booking cases but did not run the API suite or submit real bookings or payments.

During the portfolio review on 29 October 2026, the live homepage and `/rooms` rendered at 1440px and 390px with no horizontal overflow. The environment blocked `hotel-booking-8mlp.onrender.com`, Google Fonts and external avatar images. Therefore room data, authentication, booking, payments and refunds remained unverified. The observed empty result list is not evidence that the deployment contains no rooms. The source's marketing testimonials and statistics are not independent proof of actual users or commercial outcomes.

## Deploy

See [DEPLOY.md](DEPLOY.md) for the Render API, Vercel frontend and server environment configuration. Use an explicit strong `JWT_SECRET`, accurate allowed client origins and a working replica-set database. Configure Stripe and email only if you intend to support those integrations. Changing the client API URL requires a new client build.

This README documents the implementation and observed review limits; it does not change application behavior or repository visibility.
