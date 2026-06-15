# ==========================================
# Stage 1: Build & Dependencies
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install all dependencies (including devDependencies for testing/building if needed)
RUN npm ci

COPY . .

# ==========================================
# Stage 2: Production Runtime
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

COPY package*.json ./

# Only install production dependencies
RUN npm ci --only=production

# Copy source from builder stage
COPY --from=builder /usr/src/app/src ./src

# Create a non-root group and user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -u 1001 -S nodejs -G nodejs && \
    chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 3000

CMD ["node", "src/server.js"]
