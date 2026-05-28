FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @repo/api build
EXPOSE 3001
CMD ["pnpm", "--filter", "@repo/api", "start"]
