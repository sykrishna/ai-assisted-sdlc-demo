FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/web build
EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/web", "start"]
