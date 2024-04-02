FROM imbios/bun-node:latest-20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile


FROM base
COPY --from=prod-deps /app/node_modules /app/node_modules

ENTRYPOINT [ "bun", "start-worker-pm2" ]
