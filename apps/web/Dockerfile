FROM node:20-alpine
WORKDIR /workspace

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-utils/package.json packages/shared-utils/package.json

RUN pnpm config set store-dir /pnpm/store && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "--filter", "@repo/web", "dev"]
