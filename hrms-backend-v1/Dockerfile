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
# Copy only necessary files
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/prisma ./prisma

EXPOSE 5000

# Run migrations (if you want this automatically, or do it externally)
# CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main"]
CMD ["node", "dist/src/main"]
