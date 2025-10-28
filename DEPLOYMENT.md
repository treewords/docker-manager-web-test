# Deployment Guide: Docker Manager Dashboard

This guide provides step-by-step instructions to deploy the backend on a Linux VPS and the frontend on cPanel hosting.

### **Assumptions & Placeholders**

Before you begin, replace these placeholders in the commands and configurations below:

-   `api.your-domain.com`: The domain for your backend API.
-   `your-domain.com`: The domain for your frontend application.
-   `YOUR_VPS_IP`: The public IP address of your VPS.
-   `your-user`: The non-root user you will create on the VPS.
-   `your@email.com`: Your email address for Let's Encrypt SSL certificates.

---

## Part 1: Initial VPS Setup (Ubuntu 22.04)

These commands set up a secure, production-ready server environment.

### 1.1. Create a Non-Root User & Harden SSH

First, connect to your VPS as `root`.

```bash
# Create a new user (you will be prompted for a password)
adduser your-user

# Add the new user to the 'sudo' group to grant administrative privileges
usermod -aG sudo your-user

# Optional but recommended: Copy root's authorized SSH keys to the new user
mkdir -p /home/your-user/.ssh
cp /root/.ssh/authorized_keys /home/your-user/.ssh/authorized_keys
chown -R your-user:your-user /home/your-user/.ssh

# Now, disable root login over SSH for better security
nano /etc/ssh/sshd_config
```

In the editor, find the line `PermitRootLogin` and change it to `no`.

```
PermitRootLogin no
```

Save the file (`Ctrl+X`, then `Y`, then `Enter`) and restart the SSH service:

```bash
systemctl restart sshd
```

**Log out and log back in as `your-user` before proceeding.**

### 1.2. Configure Firewall (UFW)

We will use UFW (Uncomplicated Firewall) to secure the server.

```bash
# Allow SSH (port 22), HTTP (port 80), and HTTPS (port 443)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable the firewall
sudo ufw enable
```

### 1.3. Install Docker and Docker Compose

The backend runs in Docker, providing isolation and easy management.

```bash
# Install Docker Engine
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to the 'docker' group to run docker commands without sudo
sudo usermod -aG docker your-user
```

**You must log out and log back in for the group change to take effect.**

### 1.4. Install Nginx and Certbot

Nginx will act as a reverse proxy, and Certbot will provide free SSL certificates.

```bash
# Install Nginx
sudo apt-get install -y nginx

# Install Certbot for Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## Part 2: Backend Deployment

### 2.1. Clone the Repository and Configure

```bash
# Clone your project repository
git clone <your-repo-url>
cd <your-repo-folder>/backend

# Create the .env file from the example
cp .env.example .env
```

**Edit the `.env` file:**

```bash
nano .env
```

Update the following values:
-   `JWT_SECRET`: Change this to a long, random, and secret string.
-   `CORS_ORIGIN`: Set this to your frontend domain (e.g., `https://your-domain.com`).
-   `ADMIN_USERNAME` / `ADMIN_PASSWORD`: Change the default admin password.

### 2.2. Run with Docker Compose (Recommended)

This is the simplest way to run the backend.

```bash
# Build and start the container in detached mode
docker compose up --build -d

# To view logs
docker compose logs -f

# To stop
docker compose down
```

### 2.3. (Alternative) Run with systemd

If you prefer not to use Docker Compose, you can run the Docker container with a systemd service for automatic restarts.

First, build the image: `docker build -t dashboard-api .`

Then, create a systemd service file:

```bash
sudo nano /etc/systemd/system/docker-manager-api.service
```

Paste the following content. **Remember to replace `your-user` and the path to your backend directory.**

```ini
[Unit]
Description=Docker Manager API Service
After=docker.service
Requires=docker.service

[Service]
TimeoutStartSec=0
Restart=always
ExecStartPre=-/usr/bin/docker exec %n stop
ExecStartPre=-/usr/bin/docker rm %n
ExecStart=/usr/bin/docker run --rm --name %n \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /home/your-user/path/to/your/backend/data:/usr/src/app/data \
  -p 3000:3000 \
  --env-file /home/your-user/path/to/your/backend/.env \
  dashboard-api

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl enable docker-manager-api.service
sudo systemctl start docker-manager-api.service
sudo systemctl status docker-manager-api.service
```

---

## Part 3: Nginx Reverse Proxy & SSL

### 3.1. Configure Nginx

Create a new Nginx configuration file for your API domain.

```bash
sudo nano /etc/nginx/sites-available/api.your-domain.com
```

Paste the following configuration. This sets up the reverse proxy and includes placeholders for SSL.

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # This location is for WebSocket connections (used for logs)
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site by creating a symbolic link:

```bash
sudo ln -s /etc/nginx/sites-available/api.your-domain.com /etc/nginx/sites-enabled/
sudo nginx -t # Test configuration
sudo systemctl restart nginx
```

### 3.2. Obtain SSL Certificate with Certbot

```bash
# Run Certbot, which will automatically edit your Nginx config for SSL
sudo certbot --nginx -d api.your-domain.com --email your@email.com --agree-tos --no-eff-email -n
```

Certbot will handle the SSL certificate and renewal automatically. Your API is now accessible at `https://api.your-domain.com`.

---

## Part 4: Frontend Deployment (cPanel)

### 4.1. Build the React App

On your local machine, navigate to the `frontend` directory.

First, configure the API URL. Create a `.env.production` file:

```bash
# In frontend/.env.production
VITE_API_URL=https://api.your-domain.com
```

Now, install dependencies and build the static files:

```bash
npm install
npm run build
```

This will create a `dist` directory containing the production-ready static files.

### 4.2. Deploy to cPanel

1.  **Compress the build folder:** Zip the contents of the `frontend/dist` directory. Name it `build.zip`.
2.  **Log in to cPanel.**
3.  Go to **File Manager**.
4.  Navigate to the `public_html` directory (or a subdirectory, e.g., `public_html/docker-manager`).
5.  Click **Upload** and select your `build.zip` file.
6.  Once uploaded, right-click the `build.zip` file and select **Extract**.

Your frontend is now live.

### 4.3. Common Pitfalls

-   **CORS Errors:** If the frontend cannot connect to the backend, double-check that `CORS_ORIGIN` in the backend's `.env` file exactly matches your frontend domain (e.g., `https://your-domain.com`), with no trailing slash.
-   **Mixed Content Errors:** Ensure your `VITE_API_URL` uses `https://`.
-   **Routing Issues (404 on refresh):** If you get a 404 error when refreshing a page like `/container/123`, you need to add a `.htaccess` file in the same directory as your `index.html` on cPanel.

Create a `.htaccess` file with the following content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## Part 5: DNS Configuration

-   **Backend A Record:** In your domain registrar's DNS settings, create an `A` record for `api` that points to `YOUR_VPS_IP`.
-   **Frontend A Record:** Your main domain (`your-domain.com`) should have an `A` record pointing to your cPanel hosting IP address.

---

## Final Deployment Checklist

1.  [ ] Secure VPS and create a non-root user.
2.  [ ] Install Docker, Docker Compose, Nginx, and Certbot on VPS.
3.  [ ] Configure UFW firewall.
4.  [ ] Point `api.your-domain.com` DNS A record to VPS IP.
5.  [ ] Clone backend repo to VPS.
6.  [ ] Configure and create `.env` file for the backend.
7.  [ ] Run backend using `docker compose up -d`.
8.  [ ] Configure Nginx as a reverse proxy for the backend.
9.  [ ] Secure the API domain with a Let's Encrypt SSL certificate.
10. [ ] Set the production API URL in the frontend's `.env.production` file.
11. [ ] Build the frontend app (`npm run build`).
12. [ ] Upload and extract the `dist` folder contents to cPanel's `public_html`.
13. [ ] (If needed) Add `.htaccess` file for client-side routing.
14. [ ] Test the live application.

---

## One-Liner Quick Starts

-   **Start Backend:** `cd /path/to/backend && docker compose up -d`
-   **Deploy Frontend:** `npm run build && zip -r build.zip dist/* && echo "Upload build.zip to cPanel and extract."`