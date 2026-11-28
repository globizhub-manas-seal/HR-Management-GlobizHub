#!/bin/bash
# Backend startup for the sandbox mini-service:
# waits for postgres -> generates prisma client if missing -> syncs schema ->
# runs prebuilt dist (builds on first boot only) for fast startup.
set -e
cd "$(dirname "$0")"

echo "[be] waiting for postgres on 127.0.0.1:5432..."
for i in $(seq 1 120); do
  if node -e "const n=require('net');const s=n.createConnection({port:5432,host:'127.0.0.1'});s.on('connect',()=>{s.destroy();process.exit(0)});s.on('error',()=>process.exit(1));setTimeout(()=>process.exit(1),800)" 2>/dev/null; then
    echo "[be] postgres is up"; break
  fi
  sleep 1
done

if [ ! -d generated/prisma ] || [ ! -f generated/prisma/client.js ]; then
  echo "[be] generating prisma client..."
  npx prisma generate || bunx prisma generate
fi

echo "[be] syncing database schema (db push)..."
npx prisma db push --accept-data-loss --skip-generate || bunx prisma db push --accept-data-loss --skip-generate || echo "[be] WARN: db push failed"

if [ ! -f dist/src/main.js ]; then
  echo "[be] building backend (first boot)..."
  npx nest build
fi

echo "[be] starting NestJS from dist..."
exec node dist/src/main.js
