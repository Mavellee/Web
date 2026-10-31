# Mavelle web — static build served by Caddy, which also terminates HTTPS and proxies the API.
#   docker build -f web/Dockerfile -t knot-web .
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY web/package.json web/
RUN npm ci --workspace web --include-workspace-root=false --no-audit --no-fund
COPY web web
RUN cd web && npx vite build

FROM caddy:2.8-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/web/dist /srv
