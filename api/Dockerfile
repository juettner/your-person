# Two-stage build: compile TypeScript with dev dependencies, then ship only
# the compiled output and production dependencies. Spring analogy: a Maven
# build stage followed by a slim JRE image.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist

# Run as the unprivileged user the base image provides.
USER node
EXPOSE 3000
ENV PORT=3000
CMD ["node", "dist/main"]
