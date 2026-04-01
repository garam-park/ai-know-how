FROM node:22-alpine AS base
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/frontend/package.json apps/frontend/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS build
WORKDIR /app
COPY packages/shared/ packages/shared/
COPY apps/frontend/ apps/frontend/
COPY tsconfig.base.json ./
RUN cd packages/shared && pnpm run build
RUN cd apps/frontend && pnpm run build

# Serve with nginx
FROM nginx:alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
