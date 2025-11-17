# Manual Deployment Guide

This guide provides step-by-step instructions for a manual deployment of the Docker Manager Dashboard.

> **Note:** For a faster, more secure, and comprehensive setup, we strongly recommend using the automated [`vps_setup.sh`](../scripts/vps_setup.sh) script on a fresh Ubuntu 22.04 server. This script handles all the steps in this guide and more, including advanced security hardening. This manual guide is intended for users who want to customize their setup or deploy on a different OS.

## Part 1: Initial VPS Setup (Ubuntu 22.04)

These commands set up a basic server environment.

### 1.1. Create a Non-Root User & Harden SSH

First, connect to your VPS as `root`.

```bash
# Create a new user and add them to the sudo group
adduser your-user
usermod -aG sudo your-user

# Set up SSH key for the new user (replace with your actual public key)
mkdir -p /home/your-user/.ssh
echo "ssh-rsa AAAA..." > /home/your-user/.ssh/authorized_keys
chown -R your-user:your-user /home/your-user/.ssh
chmod 700 /home/your-user/.ssh
chmod 600 /home/your-user/.ssh/authorized_keys

# Harden SSH configuration
sed -i -E 's/^#?PermitRootLogin\s+.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i -E 's/^#?PasswordAuthentication\s+.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

**Log out and log back in as `your-user` before proceeding.**

### 1.2. Configure Firewall (UFW)

```bash
# Allow essential ports and enable the firewall
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 1.3. Install Dependencies

```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker your-user

# Install Nginx and Certbot
sudo apt-get install -y nginx certbot python3-certbot-nginx
```

**Log out and log back in again for Docker group permissions to apply.**

## Part 2: Backend Deployment

After cloning the repository and configuring your `.env` file, choose one of the following methods to run the backend.

### Method A: Docker Compose (Recommended)

This is the simplest way to manage the backend container.

```bash
# From the /backend directory
docker compose up --build -d
```

**Common commands:**
-   View logs: `docker compose logs -f`
-   Stop the container: `docker compose down`

### Method B: Systemd Service

This method provides automatic restarts and integrates with the system's service manager. The `vps_setup.sh` script creates a helper script to automate this, but you can do it manually as well.

1.  **Build the Docker Image:**

    ```bash
    # From the /backend directory
    docker build -t dashboard-api .
    ```

2.  **Create the systemd Service File:**

    ```bash
    sudo nano /etc/systemd/system/docker-manager-api.service
    ```

    Paste the following content, replacing `/path/to/your/backend` with the absolute path to your backend directory.

    ```ini
    [Unit]
    Description=Docker Manager API Service
    After=docker.service
    Requires=docker.service

    [Service]
    TimeoutStartSec=0
    Restart=always
    ExecStartPre=-/usr/bin/docker stop docker-manager-api
    ExecStartPre=-/usr/bin/docker rm docker-manager-api
    ExecStart=/usr/bin/docker run --rm --name docker-manager-api \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v /path/to/your/backend/data:/usr/src/app/data \
      -p 127.0.0.1:3000:3000 \
      --env-file /path/to/your/backend/.env \
      dashboard-api

    [Install]
    WantedBy=multi-user.target
    ```

3.  **Enable and Start the Service:**

    ```bash
    sudo systemctl daemon-reload
    sudo systemctl enable docker-manager-api.service
    sudo systemctl start docker-manager-api.service
    ```

    **Common commands:**
    -   Check status: `sudo systemctl status docker-manager-api`
    -   View logs: `sudo journalctl -u docker-manager-api -f`

## Part 3: Nginx Reverse Proxy & SSL

The Nginx configuration should proxy requests to the backend (running on `localhost:3000`) and handle SSL.

1.  **Create Nginx Configuration:**

    ```bash
    sudo nano /etc/nginx/sites-available/api.your-domain.com
    ```

    Paste the following configuration:

    ```nginx
    server {
        listen 80;
        server_name api.your-domain.com;
        server_tokens off; # Hide Nginx version

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.your-domain.com;

        # Basic SSL settings (Certbot will manage these)
        ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

        # Security Headers (recommended)
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "SAMEORIGIN" always;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://localhost:3000/socket.io/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
    }
    ```

2.  **Enable the Site and Get SSL Certificate:**

    ```bash
    # Enable the site
    sudo ln -s /etc/nginx/sites-available/api.your-domain.com /etc/nginx/sites-enabled/
    sudo nginx -t

    # Obtain the SSL certificate with Certbot
    sudo certbot --nginx -d api.your-domain.com --email your@email.com --agree-tos --no-eff-email -n
    ```

    Certbot will automatically edit your Nginx file to install the certificate.

3.  **Reload Nginx:**

    ```bash
    sudo systemctl reload nginx
    ```

Your API is now live at `https://api.your-domain.com`.

## Part 4: Frontend Deployment

The frontend is a static React application. Build it locally and upload the result to any static hosting service (e.g., cPanel, Netlify, Vercel).

1.  **Configure API URL:**

    On your local machine, create a `.env.production` file in the `frontend` directory:

    ```
    # In frontend/.env.production
    VITE_API_URL=https://api.your-domain.com
    ```

2.  **Build the App:**

    ```bash
    # From the /frontend directory
    npm install
    npm run build
    ```

3.  **Deploy:**

    Upload the contents of the `frontend/dist` directory to your hosting provider's file manager (e.g., `public_html` on cPanel).
