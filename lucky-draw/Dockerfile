# Stage 1: Build Frontend
FROM node:18-alpine AS builder

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install

COPY client/ .
RUN npm run build

# Stage 2: Setup Backend and Serve
FROM node:18-alpine

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install

COPY server/ .
# Copy frontend build from Stage 1 into the location expected by Express
COPY --from=builder /app/client/dist /app/client/dist

# Expose backend port
EXPOSE 3001

# Start the server
CMD ["node", "index.js"]
