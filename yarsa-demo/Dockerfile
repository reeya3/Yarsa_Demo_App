# -----------------------------
# Build Stage
# -----------------------------
FROM node:20-alpine AS build

# Upgrade npm to fix known vulnerabilities (brace-expansion, tar, glob, minimatch, cross-spawn)
RUN npm install -g npm@11.6.4

# Set working directory
WORKDIR /app

# Copy only package files first to leverage Docker layer caching
COPY package*.json ./

# Install all dependencies for building the app
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# -----------------------------
# Production Stage
# -----------------------------
FROM node:20-alpine

# Upgrade npm to fix known vulnerabilities
RUN npm install -g npm@11.6.4

# Create a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy built files and package files from build stage with correct ownership
COPY --from=build --chown=appuser:appgroup /app/dist /app/package*.json ./

# Set environment to production
ENV NODE_ENV=production

# Install only production dependencies and clean npm cache
RUN npm ci --only=production --no-optional && npm cache clean --force

# Switch to non-root user
USER appuser

# Expose API port
EXPOSE 3001

# Start the application
CMD ["node", "dist/app.js"]