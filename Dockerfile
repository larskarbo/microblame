FROM node:18-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update -y
RUN apt-get install -y openssl

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

FROM base AS build
COPY prisma ./prisma
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY .env ./
COPY src ./src
COPY public ./public
COPY tsconfig.json ./
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY scripts ./scripts
COPY next-env.d.ts ./

RUN pnpx prisma generate
RUN pnpm run build

FROM base
COPY --from=build /app /app
EXPOSE 3000
CMD [ "pnpm", "start-with-data-init" ]
