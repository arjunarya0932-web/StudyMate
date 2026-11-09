# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files for dependency caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY src/ ./src/
COPY vite.config.js ./
COPY index.html ./

# Inject production API URL at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:stable-alpine AS serve

# Copy built static files
COPY --from=build /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]