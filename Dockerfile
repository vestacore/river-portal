# River Portal web image (adr/records/ADR-0014). Built by Cloud Build from `pulumi up`.
# Build stage: install exactly the lockfile (integrity-checked, no install scripts), then build.
FROM node:22-bookworm-slim AS build
WORKDIR /repo
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json .npmrc ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
COPY infra/package.json ./infra/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY apps/web ./apps/web
RUN npm run build --workspace @river/web

# Runtime stage: distroless Node 22, non-root, only the standalone output.
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
ENV NODE_ENV=production PORT=8080 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public
USER nonroot
EXPOSE 8080
CMD ["apps/web/server.js"]
