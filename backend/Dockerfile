# ---- Base Node ----
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# ---- Dependencies ----
FROM base AS dependencies
RUN npm install --production

# ---- Release ----
FROM node:18-alpine AS release
WORKDIR /usr/src/app
COPY --from=dependencies /usr/src/app/node_modules ./node_modules
COPY docs ./docs
COPY . .

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Create data directory
RUN mkdir -p /usr/src/app/data

# Copy entrypoint script
COPY entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh

USER root

# Expose the port the app runs on
EXPOSE 3000

# Set entrypoint
ENTRYPOINT ["entrypoint.sh"]

# Run the application
CMD ["node", "src/app.js"]