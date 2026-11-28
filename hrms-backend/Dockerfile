# Base image
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Dependencies stage
FROM base AS deps
COPY package.json package-lock.json ./
# Install all dependencies (including dev for building)
RUN npm ci

# Build stage
FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
# Generate Prisma client and build NestJS
RUN npx prisma generate
RUN npm run build
# Remove devDependencies to keep image small
RUN npm prune --omit=dev

# Production image
FROM base AS production
ENV NODE_ENV=production

# Install curl/wget for healthchecks
RUN apk add --no-cache curl

# Copy application files and set ownership to node user
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/package.json ./package.json
COPY --chown=node:node --from=build /usr/src/app/prisma ./prisma

# S-16: Run as non-root user
USER node

# S-16: Container healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:5000/ || exit 1

EXPOSE 5000

CMD ["node", "dist/src/main"]
