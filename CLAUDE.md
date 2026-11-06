# LofiTalk

Social/dating chat app. Monorepo with three independent npm projects (no workspaces):

| Folder | Stack | Dev command | Port |
|---|---|---|---|
| `backend/` | Node (ESM), Express 4, Mongoose 8, Socket.IO 4, JWT cookie auth | `npm run dev` (nodemon) | 5001 locally (via `backend/.env`) |
| `frontend/` | React + Vite, Tailwind + daisyUI, socket.io-client | `npm run dev` | 5173 |
| `mobile/` | Expo SDK 54 (React Native) | `npm run start -- --lan` | - |

There is no root `package.json`; run npm inside each folder. Backend: `src/app.js` builds the Express app (helmet CSP, routes, SPA fallback), `src/server.js` creates the HTTP server, Socket.IO and DB connections.

With `NODE_ENV=production` the backend also serves `frontend/dist` (SPA fallback via `app.get("*")`), so production is one process on one origin; the web frontend calls `/api` and Socket.IO on its own origin.

## Configuration
- Backend env: `backend/.env` (gitignored); every variable is documented in `backend/.env.example`.
  Required: `MONGO_URI`, `JWT_SECRET_KEY`. `PORT` defaults to 8080 and the server binds `0.0.0.0`.
- Tarot uses the **Anthropic Claude API** server-side only (`@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` default `claude-haiku-5-5`) with a JSON-schema `output_config` in `backend/src/controllers/tarot.controller.js`. Provider errors are logged, clients get a generic message.
- `CHAT_MONGO_URI` is optional; when unset, chat models reuse the main Mongoose connection.
- Web Push (optional): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` (secret), `VAPID_SUBJECT`; all empty = feature off (`backend/src/lib/pushService.js`).
- Frontend build-time overrides (optional): `VITE_API_BASE_URL`, `VITE_CHAT_WS_URL`. Mobile: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_CHAT_WS_URL`.

## Gotchas
- `frontend/src/pages/NotificationsPage.jsx` imports an image from `backend/src/assets/logo/`; the Dockerfile copies that folder into the frontend build stage.
- `vite` is a devDependency: building with `NODE_ENV=production` needs `npm ci --include=dev` (the Dockerfile frontend stage does not set NODE_ENV).
- Mobile server URLs live only in `mobile/src/config.js` (default `https://lofitalk.nghiapham.org`, local override `EXPO_PUBLIC_SERVER_URL`). The forced-update check compares backend `MOBILE_APP_VERSION` (GET `/api/meta/version`) with `version` in `mobile/app.json` by exact string match.
- Production uses only `https://lofitalk.nghiapham.org` and starts on an empty Azure DocumentDB (no data migration); the mobile release is deferred.
- Indexes: `autoIndex` is off; `ensureIndexes()` (`backend/src/lib/indexes.js`) creates every model's indexes after the server starts listening. The first admin can only be set with `backend/scripts/make-admin.js <email>`.
- Auth cookie is `httpOnly`, `sameSite: strict`, `secure` in production: frontend and API must share one site.
- Security conventions (keep them when adding code):
  - Chat: always go through `findConversationForParticipant` / `resolveConversationForSender` (`backend/src/lib/chatService.js`); never act on a `threadId` without checking the caller is a participant.
  - Auth tokens: only via `backend/src/lib/authToken.js` (`signAuthToken` puts `tokenVersion` in the JWT; `protectRoute` and the socket handshake reject stale versions). Bump `user.tokenVersion` to log out all sessions.
  - Input: `rejectMongoOperators` runs globally (no `$`/`__proto__` keys in body or query); use `requireScalarFields` for credential fields and `router.param(..., requireObjectIdParam)` for id params.
  - Schemas: every route that reads `req.body`/`req.query` gets `validate({ body, query })` with a zod schema from `backend/src/validation/schemas.js` (loose objects: check type + size, never strip fields, so older mobile clients keep working; login accepts legacy passwords shorter than 8). Errors are 400 `INVALID_INPUT` with a readable `message` (shown by the web app) and `errors[]`.
  - Rate limits: HTTP limiters in `backend/src/middleware/rateLimit.middleware.js` (in-memory, `trust proxy` = 1 hop for the Azure ingress, override with `TRUST_PROXY_HOPS`); socket limits in `backend/src/lib/socketRateLimiter.js`.
- Realtime hints instead of polling: controllers call `notifyUsers` / `notifyAdmins` / `notifyEveryone` (`backend/src/lib/chatSocket.js`, topics in `NotifyTopic`) after changing friend requests, admin notifications or reports; `components/RealtimeNotificationsBridge.jsx` maps topics to react-query keys (keep both lists in sync). Remaining polling is a 5-min safety net (`FALLBACK_REFETCH_MS`) plus the 30 s online counter.
- Web Push: only for new chat messages and only when the recipient has no live socket (`pushIfOffline`). `frontend/public/sw.js` has no fetch handler/offline cache on purpose. Logout removes the browser subscription first; account deletion and suspension delete all of the user's subscriptions.
- Socket.IO rooms, MatchMind / Truth-or-Lie invites and a user cache are in process memory: run exactly one replica (no Redis adapter). Pending invites are re-sent on (re)connect; a user is marked offline only when their last socket disconnects.
- Web idle handling (`frontend/src/components/RealtimeIdleManager.jsx`, timeouts in `frontend/src/constants/realtime.js`): tab hidden 10 min or no activity 30 min -> Socket.IO paused (same instance, listeners kept) and polling stopped (`useRealtimeStore().paused`); on return it reconnects and invalidates all queries. Rooms are per connection, so `ChatPage` re-joins its thread on every `connect`.
- The ghcr.io package is public (repo is public); the image must never contain secrets.
- `profilePic` stores absolute URLs built from `ASSET_BASE_URL` (`backend/src/utils/assetUrl.js`): either a preset (`/static/avatars/...`, read-only files in `backend/src/assets/avatars`) or an uploaded avatar (`/api/avatars/<id>?v=<updatedAt ms>`). Never store image data (data: URLs) in the user document.
- Avatar upload (web): `POST /api/avatars` (auth, 10 per 15 min per user, multer memory 5 MB) -> magic-byte check (JPEG/PNG/WebP/HEIC) -> sharp rotate + centre crop 256x256 WebP q80, metadata stripped (`backend/src/lib/avatarImage.js`). One job at a time (queue 4, else 503), 40 MP input cap; HEIC is decoded by `heic-decode` in a short-lived worker (`heicDecodeWorker.js`) because prebuilt sharp cannot decode HEVC. Stored in the `avatars` collection (one doc per user, upsert = replace); `GET /api/avatars/:id` caches immutably only for the current `?v`. Switching to a preset or deleting a user removes the avatar (User model delete hooks). Frontend: `components/AvatarUploader.jsx` + `utils/avatarImage.js` (client crop/resize to 512 WebP, HEIC falls back to the original).
- No disk writes; all persistent data (including uploaded avatars) is in MongoDB.
- Signup requires email verification: `signup` stores a `PendingSignup` and emails a 6-digit code (15 min, max 5 wrong attempts, pending docs TTL 24h); `verify-code` creates the user and logs in. Submitting signup again re-sends a code. In production, missing `MAIL_*` makes signup return 502 and password reset 500 (never silent); in development the code is printed to the console.

- Accounts: passwords need at least 8 characters. Emails are stored lower-case; `findUserByEmail` (auth controller) falls back to a case-insensitive match for legacy rows and normalizes them on login.
- Suspension: `PUT/DELETE /api/admin/users/:id/ban` sets/clears `bannedUntil` + `banReason` (permanent = 9999-12-31, see `backend/src/lib/accountStatus.js`), bumps `tokenVersion` and disconnects sockets. Login, `protectRoute` and the socket handshake reject banned users with 403 `ACCOUNT_SUSPENDED`. Admins cannot be suspended.
- Account deletion: `DELETE /api/users/me` (password required) removes the user's chats, friend requests, reports and references in other users (`backend/src/controllers/account.controller.js`). Add new user-owned collections there.
- Health: `GET /api/health` (liveness, no DB) and `GET /api/health/ready` (DB ping, 503 when down).
- Static caching: only Vite's hashed `dist/assets/*` are `immutable`; everything else from `frontend/public` (sw.js, manifest, icons, og-image) is `no-cache`.
- Shared constants: profile select lists in `frontend/src/constants/profileOptions.js` (`useProfileOptions`), Tarot energy in `backend/src/lib/energy.js` (the web app reads `max` from the API), preset avatars listed by `GET /api/meta/avatars` from the files on disk (mobile still has its own copy in `mobile/src/utils/avatarPool.js`). Preset PNGs are 256 px palette PNGs: keep file names, `profilePic` URLs point to them.
- i18n: `frontend/src/languages/en.js` + `vi.js` are lazy chunks; `main.jsx` loads the active one before the first render, English loads in the background as fallback. Both files must keep the same keys. `<html lang>` follows the language.
- Accessibility: form labels use `htmlFor`/`id`, icon-only buttons need `aria-label`; axe (WCAG 2.1 AA) was clean on the default `coffee` and `dark` themes. Light themes still fail contrast for the brand red/green text (design decision pending).
- Frontend: pages are `React.lazy` routes in `App.jsx` behind an `ErrorBoundary`; unknown URLs render `NotFoundPage`. Modals that must cover the layout use `createPortal(..., document.body)`. Theme is stored under `lofitalk-theme`.

## Tests
Backend: `cd backend && npm test` (node:test, `backend/test/`). Each file starts the app on its own database (`lofitalk-test-*`) at `TEST_MONGO_URI` (default `mongodb://localhost:27017`) and drops it first. CI runs them against a `mongo:7` service before every deploy. Frontend: `npm run lint` must stay at 0 problems.
GitHub Actions are pinned to commit SHAs (comment = version); the deploy job keeps the 10 newest ghcr images (`provenance`/`sbom` off so each push is a single manifest).

## Local test environment
MongoDB runs in Docker container `lofitalk-mongo` (`mongo:7`, volume `lofitalk-mongo-data`, port 27017); `backend/.env` points to `mongodb://localhost:27017/lofitalk`. Manual tests use the `lofitalk-dev` database, never production.

## Deployment
Azure Container Apps app `lofitalk` (env `lofitalk-env`, germanywestcentral, Consumption 0.25 vCPU / 0.5 Gi, min 0 / max 1 replicas, target port 8080), custom domain `https://lofitalk.nghiapham.org`.
`Dockerfile` (multi-stage, non-root) → `.github/workflows/deploy.yml` pushes `ghcr.io/pitien207/lofitalk:{latest,<sha>}` and runs `az containerapp update` via OIDC.
Database: Azure DocumentDB Free Tier cluster `lofitalk-db` (MongoDB 8.0, germanywestcentral, resource group `lofitalk-rg`; firewall allows Azure services + the owner's IP). Manual steps are in `DEPLOYMENT.md` (Vietnamese).
GitHub Actions logs in with app registration `github-lofitalk-deploy` (OIDC federated credential for `main`, no client secret), role `Container Apps Contributor` on `lofitalk-rg`; repo secrets `AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`, variable `AZURE_RESOURCE_GROUP`.
Do not create paid Azure resources (no ACR, no Log Analytics) without stating the cost first.
