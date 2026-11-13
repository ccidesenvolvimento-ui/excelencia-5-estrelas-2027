# Homologação local 2026 — Next.js em modo servidor.
# A publicação estática do GitHub Pages continua independente.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json ./
# Repositório ainda sem lockfile: pinagem reprodutível será tratada em PR próprio.
RUN npm install --no-audit --no-fund
COPY . .
# Instalacao opcional da tela/API de ajustes APENAS na imagem Node.
# Valor padrao false. Nunca injetar segredos nem habilitar no GitHub Pages.
ARG EXCELENCIA_NODE_AJUSTES_ENABLED=false
# Next.js 16: proxy apenas no build Node; a API depende ainda de flags
# e de permissoes no runtime. Nao configura contas ou banco.
RUN EXCELENCIA_NODE_AJUSTES_ENABLED="$EXCELENCIA_NODE_AJUSTES_ENABLED" \
    node scripts/preparar-ajustes-node.cjs \
    && cp src/server/proxy-autenticacao.ts src/proxy.ts \
    && npm run build

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
