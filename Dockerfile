# Homologação local 2026 — Next.js em modo servidor.
# A publicação estática do GitHub Pages continua independente.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
# Repositório ainda sem lockfile: pinagem reprodutível será tratada em PR próprio.
RUN npm install --no-audit --no-fund
COPY . .
# Next.js 16: proxy só no build Node; GitHub Pages permanece sem proxy.
RUN cp src/server/proxy-autenticacao.ts src/proxy.ts && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/.next ./.next
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/next.config.ts ./next.config.ts
USER node
EXPOSE 3000
CMD ["npm","run","start"]
