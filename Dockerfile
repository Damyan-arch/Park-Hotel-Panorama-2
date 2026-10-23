# Node.js backend (Backend/) + the built Vite frontend it serves (Frontend/dist).
# Built from the repo root because server.js serves ../Frontend/dist.

# --- Stage 1: build the frontend ---
FROM node:24-slim AS frontend
WORKDIR /app/Frontend
COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

# --- Stage 2: install backend production dependencies ---
FROM node:24-slim AS backend-deps
WORKDIR /app/Backend
COPY Backend/package.json Backend/package-lock.json ./
RUN npm ci --omit=dev

# --- Stage 3: runtime image ---
FROM node:24-slim
ENV NODE_ENV=production
WORKDIR /app/Backend
COPY --from=backend-deps /app/Backend/node_modules ./node_modules
COPY Backend/ ./
COPY --from=frontend /app/Frontend/dist /app/Frontend/dist

# Run as the unprivileged user the official image ships with.
USER node
EXPOSE 3002

# Apply pending TypeORM migrations, then hand PID 1 to node so it gets stop signals.
CMD ["sh", "-c", "npm run db:migrate && exec node server.js"]
