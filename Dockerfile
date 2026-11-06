# syntax=docker/dockerfile:1

# ---- 1. Build the React frontend ----
FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# NotificationsPage.jsx imports an image from backend/src/assets/logo.
COPY backend/src/assets/logo /app/backend/src/assets/logo
RUN npm run build

# ---- 2. Install backend production dependencies ----
FROM node:24-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# ---- 3. Runtime image ----
FROM node:24-alpine AS runtime
ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

# Files stay owned by root (read-only for the app); the process runs as "node".
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/package.json ./backend/package.json
COPY backend/src ./backend/src
# server.js serves ../frontend/dist relative to backend/
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

USER node
EXPOSE 8080
CMD ["node", "backend/src/server.js"]
