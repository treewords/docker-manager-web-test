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
# Expose the port the app runs on
EXPOSE 3000

# Switch to root user to have permission for the docker socket
USER root

# Run the application
CMD ["node", "src/app.js"]