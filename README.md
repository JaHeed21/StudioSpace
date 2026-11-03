# StudioSpace

StudioSpace is a TypeScript monorepo for a creative studio rental marketplace. The frontend and backend are separate npm workspaces under `apps/web` and `apps/api`.

## Requirements

- Node.js 20.9 or newer and npm
- A MongoDB Atlas cluster or a local MongoDB server

## Local setup

1. Install dependencies from the repository root:

   ```sh
   npm install
   ```

2. Create `apps/api/.env` from `apps/api/.env.example`. Replace `<db_password>` in `MONGODB_URI` with your MongoDB Atlas database user's password; percent-encode any reserved URI characters in the password. Set a private random value for `BETTER_AUTH_SECRET` (at least 32 characters). Backend secrets must remain in this file and must not use a `NEXT_PUBLIC_` prefix.

3. Optionally add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `apps/api/.env` to enable Google sign-in. In Google Cloud, add the API callback URL `http://localhost:4000/api/auth/callback/google` as an authorized redirect URI. For production, use `https://<api-domain>/api/auth/callback/google`.

4. Create `apps/web/.env.local` from `apps/web/.env.example` if the API is not at `http://localhost:4000/api`.

5. Start both applications from the root:

   ```sh
   npm run dev
   ```

   The Next.js app is at `http://localhost:3000`; the Express API is at `http://localhost:4000`.

## Verification

With MongoDB available and the API environment configured:

- `npm run db:check` connects, pings MongoDB, and closes the client.
- `npm run test:health` requests `GET http://localhost:4000/api/health` and fails for network or non-2xx responses. Set `API_URL` to test a different API origin.
- `npm run test:auth` runs registration, password rejection, invalid/valid login, cookie-backed session persistence, protected-route 401/200 behavior, role-based 403 behavior, logout, and studio create/read/filter/update/delete with non-owner rejection against a running API and MongoDB. Google OAuth initialization is checked when both Google credentials are configured; completing the provider's browser consent flow requires a configured Google application.
- `npm run test:bookings` tests booking validation, server-side price calculations, customer/host authorization, cancellation, confirmed-time overlap, adjacent reservations, and concurrent confirmation attempts against a running API and MongoDB.
- `npm run test:api` runs the Vitest/Supertest integration suite against a temporary database with a unique name, which is dropped after completion. Configure `apps/api/.env` first.
- `npm run seed:demo` idempotently adds six clearly marked, non-bookable sample studios to the configured MongoDB database. They appear in the featured and explore studio views without adding frontend placeholder data.
- `npm run typecheck`, `npm run lint`, and `npm run build` validate the workspaces.

The health endpoint reports `{ "status": "ok", "database": "connected" }` only when MongoDB responds to a ping; otherwise it returns an error response. Better Auth endpoints are mounted at `/api/auth/*`. Authenticated application routes include `GET /api/me` and `GET /api/admin`; regular users receive 403 from the latter. The protected `/dashboard` page includes host booking management and logout.

Authentication uses Better Auth's database-backed sessions and HttpOnly cookies, not JWT. Browser requests use credentials and the API allows the configured `WEB_ORIGIN`. Cookies are `SameSite=Lax` in development and `SameSite=None; Secure` in production to support cross-site frontend/API deployments. For Safari deployments on unrelated domains, use a same-site reverse proxy because third-party cookie blocking may prevent session persistence.

The studio API supports public `GET /api/studios` (filtered and paginated), `GET /api/studios/featured`, and `GET /api/studios/:id`; authenticated routes provide `POST /api/studios`, `GET /api/studios/my-listings`, `PATCH /api/studios/:id`, `DELETE /api/studios/:id`, and `POST /api/studios/upload-image`. Studio documents include title, category, hourly rate, deposit, capacity, location, image URL, amenities, description, owner identity, rating, and timestamps. Owner identity is always derived from the verified Better Auth session. Server startup creates browse and owner indexes. The home page requests featured studios from MongoDB and never uses frontend sample listings.

The booking API provides authenticated `POST /api/bookings`, `GET /api/bookings/my-bookings`, host-owned `GET /api/bookings`, `PATCH /api/bookings/:id/cancel`, and `PATCH /api/bookings/:id/status`. Booking requests save a server-calculated price snapshot and begin in `Pending`. Only confirmed reservations block overlapping times; customers can cancel their own pending requests, while hosts can confirm/decline pending requests or manage confirmed sessions. Date values use `YYYY-MM-DD`; times use 24-hour `HH:mm` values in the studio's local time. The server rejects past calendar dates using UTC date as the deterministic reference because studios do not yet store timezone metadata.

The authenticated `GET /api/dashboard/summary` endpoint calculates listing and booking totals from MongoDB and returns recent booking activity. Wishlist endpoints (`GET /api/wishlist`, `POST /api/wishlist/:studioId`, and `DELETE /api/wishlist/:studioId`) store studio saves per verified user ID. Profile settings update only the Better Auth user's name and profile image; the sign-in email, role, and listing ownership data are not editable there. Dashboard pages live under `/dashboard` and `/my-listings` and `/my-bookings` redirect to their dashboard equivalents.

Confirmation and booking writes use a MongoDB transaction and a per-studio/date guard document. Each transaction writes that shared guard before checking confirmed overlaps, so concurrent confirmations for one studio and date serialize and the later transaction rechecks availability. MongoDB transactions require a replica set or sharded cluster (MongoDB Atlas is supported); standalone MongoDB deployments cannot provide this consistency guarantee.

To enable secure ImgBB uploads, set `IMGBB_API_KEY` in `apps/api/.env`. The API accepts JPEG, PNG, WebP, or GIF images up to 10 MB, verifies the image signature, and keeps the key on the server. Image uploads return HTTP 503 until the key is configured.

## Project layout

```text
apps/
  api/
    scripts/                 MongoDB, API health, auth, studio, and booking verification
    src/
      config/                Environment configuration
      db/                    MongoDB lifecycle and collection access
      middleware/            HTTP errors and API middleware
      modules/
        auth/                Better Auth configuration
        health/              Health endpoint
        studios/             Validated CRUD, browse, indexes, ImgBB uploads
        bookings/            Transactional reservations and status transitions
      app.ts                 Express app configuration
      server.ts              Server startup and graceful shutdown
  web/
    src/
      app/                   Next.js App Router, global styles, route states
      components/            Shared auth, dashboard, studio, and marketplace components
      lib/                   Axios client and shared utilities
    components.json          shadcn/ui generator configuration
    tailwind.config.ts       Tailwind theme and design-token mappings
```
