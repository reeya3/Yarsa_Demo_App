FROM node:18-alpine

# Install bash (or use sh)
RUN apk add --no-cache bash

# Create user WITH shell
RUN addgroup -S appgroup && adduser -S appuser -G appgroup -s /bin/sh

# Set working directory
WORKDIR /app

# Fix permissions
RUN chown -R appuser:appgroup /app

# Install dev tools
RUN npm install -g nodemon typescript

# Switch user
USER appuser