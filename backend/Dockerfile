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

# Allow the docker gid to be passed in at build time
ARG DOCKER_GID=999

# Create a non-root user and switch to it
# This is a robust way to add the user to the docker group,
# regardless of whether the GID is already in use.
RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    DOCKER_GROUP_NAME=$(getent group $DOCKER_GID | cut -d: -f1) && \
    if [ -z "$DOCKER_GROUP_NAME" ]; then \
        DOCKER_GROUP_NAME=docker && \
        addgroup -g $DOCKER_GID $DOCKER_GROUP_NAME; \
    fi && \
    adduser appuser $DOCKER_GROUP_NAME

# Install su-exec for privilege dropping (available in Alpine 3.21)
RUN apk add --no-cache su-exec

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