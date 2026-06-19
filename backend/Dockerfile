FROM node:20-slim AS base

RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /backend

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

EXPOSE 8060

HEALTHCHECK --interval=20s --timeout=5s --start-period=30s \
  CMD node -e "require('http').get('http://localhost:8060/ping', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# dev: nodemon watches for changes when source is volume-mounted
# k8s: ts-node runs from baked-in source (image rebuilt on change)
CMD ["./node_modules/.bin/ts-node", "--transpile-only", "src/index.ts"]
