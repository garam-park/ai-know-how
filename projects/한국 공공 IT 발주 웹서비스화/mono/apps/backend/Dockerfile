FROM node:22-alpine AS base
RUN apk add --no-cache openssl
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/backend/package.json apps/backend/
RUN pnpm install --frozen-lockfile

# Build shared package
FROM deps AS build-shared
WORKDIR /app
COPY packages/shared/ packages/shared/
COPY tsconfig.base.json ./
RUN cd packages/shared && pnpm run build

# Build backend
FROM build-shared AS build
COPY apps/backend/ apps/backend/
RUN cd apps/backend && npx prisma generate && pnpm run build

# Production image
FROM node:22-alpine AS production
RUN apk add --no-cache openssl
RUN npm install -g pnpm
WORKDIR /app
COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/packages/shared/package.json packages/shared/
COPY --from=build /app/packages/shared/dist/ packages/shared/dist/
COPY --from=build /app/apps/backend/package.json apps/backend/
COPY --from=build /app/apps/backend/dist/ apps/backend/dist/
COPY --from=build /app/apps/backend/prisma/ apps/backend/prisma/
COPY --from=build /app/node_modules/ node_modules/
COPY --from=build /app/apps/backend/node_modules/ apps/backend/node_modules/

WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["node", "dist/main.js"]
