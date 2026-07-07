# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy application files
COPY . .

# Create SQLite database directory
RUN mkdir -p /app/data

# Expose port 3000
EXPOSE 3000

# Initialize database on startup
RUN npm run db:init

# Start the application
CMD ["node", "index.js"]
