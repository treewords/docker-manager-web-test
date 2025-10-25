FROM nginx:latest

# Create SSL directory
RUN mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/self-signed.key \
    -out /etc/nginx/ssl/self-signed.crt \
    -subj "/C=US/ST=New York/L=New York/O=DockerMist/CN=localhost"

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
