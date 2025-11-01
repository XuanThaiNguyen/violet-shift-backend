# -----------------------------
# Stage 1: Build
# -----------------------------
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only dependency files first (for better caching)
COPY package.json yarn.lock ./

# Install dependencies (without dev env caching)
RUN yarn install --frozen-lockfile

# Copy the full project
COPY . .

# Build TypeScript source to dist/
RUN yarn build


# -----------------------------
# Stage 2: Runtime
# -----------------------------
FROM node:22-alpine

WORKDIR /app

# Copy only package.json and yarn.lock files to expose executable scripts also install dependencies
COPY package.json yarn.lock ./

# Install dependencies with production environment
RUN yarn install --production --frozen-lockfile

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Expose app port (change if needed)
EXPOSE 8080

# Run the app
CMD ["yarn", "start"]
