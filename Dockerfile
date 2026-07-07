# Use official Node.js LTS image as base
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create SQLite database directory (persisted via volume)
RUN mkdir -p /app/data

# Expose port 3000
EXPOSE 3000

# Initialize database on startup
RUN npm run db:init

# Start the application
CMD ["node", "index.js"]
