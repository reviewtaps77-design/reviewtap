# syntax=docker/dockerfile:1

ARG NODE_VERSION=20-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app

FROM base AS deps
RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps
RUN npx prisma generate

FROM base AS builder
WORKDIR /usr/src/app

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=deps /usr/src/app/prisma ./prisma
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

FROM base AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /usr/src/app/public ./public
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/.next ./.next

RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm start -- --hostname 0.0.0.0 --port 3000"]
