# LofiTalk

Social/dating chat app. Monorepo with three independent npm projects (no workspaces):

| Folder | Stack | Dev command | Port |
|---|---|---|---|
| `backend/` | Node (ESM), Express 4, Mongoose 8, Socket.IO 4, JWT cookie auth | `npm run dev` (nodemon) | 5001 locally (via `backend/.env`) |
| `frontend/` | React + Vite, Tailwind + daisyUI, socket.io-client | `npm run dev` | 5173 |
| `mobile/` | Expo SDK 54 (React Native) | `npm run start -- --lan` | - |

With `NODE_ENV=production` the backend also serves `frontend/dist` (SPA fallback via `app.get("*")`), so production is one process on one origin; the web frontend calls `/api` and Socket.IO on its own origin.

## Configuration
- Backend env: `backend/.env` (gitignored); every variable is documented in `backend/.env.example`.
  Required: `MONGO_URI`, `JWT_SECRET_KEY`. `PORT` defaults to 8080 and the server binds `0.0.0.0`.
- Tarot uses the **Anthropic Claude API** server-side only (`@anthropic-ai/sdk`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` default `claude-haiku-5-5`) with a JSON-schema `output_config` in `backend/src/controllers/tarot.controller.js`. Provider errors are logged, clients get a generic message.
- `CHAT_MONGO_URI` is optional; when unset, chat models reuse the main Mongoose connection.
- Frontend build-time overrides (optional): `VITE_API_BASE_URL`, `VITE_CHAT_WS_URL`. Mobile: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_CHAT_WS_URL`.

## Gotchas
- `frontend/src/pages/NotificationsPage.jsx` imports an image from `backend/src/assets/logo/`; the Dockerfile copies that folder into the frontend build stage.
- `vite` is a devDependency: building with `NODE_ENV=production` needs `npm ci --include=dev` (the Dockerfile frontend stage does not set NODE_ENV).
- Mobile server URLs live only in `mobile/src/config.js` (default `https://lofitalk.nghiapham.org`, local override `EXPO_PUBLIC_SERVER_URL`). The forced-update check compares backend `MOBILE_APP_VERSION` (GET `/api/meta/version`) with `version` in `mobile/app.json` by exact string match.
- Production uses only `https://lofitalk.nghiapham.org` and starts on an empty Azure DocumentDB (no data migration); the mobile release is deferred.
- Indexes: `autoIndex` is off; `ensureIndexes()` (`backend/src/lib/indexes.js`) creates every model's indexes after the server starts listening. The first admin can only be set with `backend/scripts/make-admin.js <email>`.
- Auth cookie is `httpOnly`, `sameSite: strict`, `secure` in production: frontend and API must share one site.
- Socket.IO rooms, MatchMind / Truth-or-Lie invites and a user cache are in process memory: run exactly one replica (no Redis adapter). Pending invites are re-sent on (re)connect; a user is marked offline only when their last socket disconnects.
- Web idle handling (`frontend/src/components/RealtimeIdleManager.jsx`, timeouts in `frontend/src/constants/realtime.js`): tab hidden 10 min or no activity 30 min -> Socket.IO paused (same instance, listeners kept) and polling stopped (`useRealtimeStore().paused`); on return it reconnects and invalidates all queries. Rooms are per connection, so `ChatPage` re-joins its thread on every `connect`.
- The ghcr.io package is public (repo is public); the image must never contain secrets.
- `profilePic` stores absolute URLs built from `ASSET_BASE_URL`.
- No file uploads or disk writes; avatars are read-only files in `backend/src/assets/avatars`. All persistent data is in MongoDB.
- Signup email verification is currently disabled (code commented out in `auth.controller.js`), so signup logs in directly.

## Local test environment
MongoDB runs in Docker container `lofitalk-mongo` (`mongo:7`, volume `lofitalk-mongo-data`, port 27017); `backend/.env` points to `mongodb://localhost:27017/lofitalk`.

## Deployment
Azure Container Apps app `lofitalk` (env `lofitalk-env`, germanywestcentral, Consumption 0.25 vCPU / 0.5 Gi, min 0 / max 1 replicas, target port 8080), custom domain `https://lofitalk.nghiapham.org`.
`Dockerfile` (multi-stage, non-root) → `.github/workflows/deploy.yml` pushes `ghcr.io/pitien207/lofitalk:{latest,<sha>}` and runs `az containerapp update` via OIDC.
Database: Azure DocumentDB Free Tier cluster `lofitalk-db` (MongoDB 8.0, germanywestcentral, resource group `lofitalk-rg`; firewall allows Azure services + the owner's IP). Manual steps are in `DEPLOYMENT.md` (Vietnamese).
GitHub Actions logs in with app registration `github-lofitalk-deploy` (OIDC federated credential for `main`, no client secret), role `Container Apps Contributor` on `lofitalk-rg`; repo secrets `AZURE_CLIENT_ID/TENANT_ID/SUBSCRIPTION_ID`, variable `AZURE_RESOURCE_GROUP`.
Do not create paid Azure resources (no ACR, no Log Analytics) without stating the cost first.
