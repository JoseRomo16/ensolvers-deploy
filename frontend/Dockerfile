# --- build stage -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY package*.json ./
RUN npm ci

# The API URL is inlined into the bundle at build time, so it has to be a build
# arg rather than a runtime environment variable.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY . .
RUN npm run build

# --- runtime stage -----------------------------------------------------------
# The build output is static HTML/CSS/JS, so it is served by nginx. There is no
# Node process rendering pages: this is a pure SPA.
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80
