FROM node:18-alpine

# Run as non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy package files first for better layer caching
COPY --chown=appuser:appgroup package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application source
COPY --chown=appuser:appgroup src/ ./src/

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
