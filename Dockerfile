FROM node:18-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package files and install production dependencies
COPY --chown=appuser:appgroup package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY --chown=appuser:appgroup src/ ./src/

USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
