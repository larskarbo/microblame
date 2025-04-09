FROM imbios/bun-node:latest-22-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY src ./src
COPY public ./public
COPY tsconfig.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY scripts ./scripts
COPY next-env.d.ts ./

RUN pnpx prisma generate
