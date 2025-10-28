# Advanced Security Hardening Guide

This guide provides advanced security measures to further harden your Docker Manager Dashboard deployment. These steps should be implemented after following the initial `SECURITY.md` checklist.

## 1. Advanced Fail2Ban Configuration

Beyond the basic SSH and bot protection, you can add more specific jails to protect Nginx from common attacks.

First, create the necessary filter files.

**/etc/fail2ban/filter.d/nginx-xss.conf**
```ini
[Definition]
failregex = ^<HOST> -.*GET.*(\.|\/|\(|\)|<|>|%22|%3C|%3E|'|%27|`|%60).*
```

**/etc/fail2ban/filter.d/nginx-sqli.conf**
```ini
[Definition]
failregex = ^<HOST> -.*GET.*(union|select|insert|cast|convert|delete|drop|update|order|by|--|/\*|\*/|#).*
```

Now, add the new jails to your `/etc/fail2ban/jail.local` file:

```ini
[nginx-xss]
enabled = true
port = http,https
filter = nginx-xss
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 1h

[nginx-sqli]
enabled = true
port = http,https
filter = nginx-sqli
logpath = /var/log/nginx/access.log
maxretry = 2
bantime = 1h
```

Restart Fail2Ban to apply the new rules:
```bash
sudo systemctl restart fail2ban
```

## 2. Host-based Intrusion Detection (AIDE)

AIDE (Advanced Intrusion Detection Environment) creates a database of file signatures on your system. You can then run it periodically to check for any unauthorized changes to critical files.

**Installation:**
```bash
sudo apt-get install -y aide
```

**Initialization:**
The first time you run AIDE, it will build its initial database. This should be done on a known clean system.
```bash
sudo aideinit
# This will create /var/lib/aide/aide.db.new
# Rename it to become the active database
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

**Checking for Changes:**
To check your system against the database, run:
```bash
sudo aide.wrapper --check
```
Any changes to files will be reported. If the changes are legitimate (e.g., after a package upgrade), you must update the database:
```bash
sudo aide.wrapper --update
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```
It's a good practice to run this check as a daily cron job.

### OSSEC
OSSEC is a full-featured, open-source Host-based Intrusion Detection System (HIDS). It performs real-time log analysis, file integrity monitoring, rootkit detection, and active response. It provides a more comprehensive level of monitoring than AIDE by actively analyzing system behavior.

**Checking Status:**
The `vps_setup.sh` script installs and enables OSSEC. You can check its status with:
```bash
sudo /var/ossec/bin/ossec-control status
```

**Viewing Alerts:**
Alerts are sent to the email address configured during setup and are also logged. You can view the live alert log with:
```bash
sudo tail -f /var/ossec/logs/alerts/alerts.log
```

## 3. Automatic Security Updates

The `unattended-upgrades` package can automatically install the latest security patches, which is crucial for maintaining a secure server.

**Installation:**
```bash
sudo apt-get install -y unattended-upgrades
```

**Configuration:**
Enable it by running the configuration tool:
```bash
sudo dpkg-reconfigure --priority=low unattended-upgrades
```
Select "Yes" when prompted. This will create the file `/etc/apt/apt.conf.d/20auto-upgrades` with the correct settings to enable automatic updates.

## 4. Hardened Nginx Configuration

Replace your existing `/etc/nginx/sites-available/api.your-domain.com` with this more secure version. It adds stronger SSL ciphers and important security headers.

```nginx
server {
    listen 80;
    server_name api.your-domain.com;
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    # SSL Configuration (Certbot will manage these paths)
    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    # Hardened SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_ecdh_curve secp384r1;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    # Content-Security-Policy: Allows 'unsafe-eval' for xterm.js and 'unsafe-inline' for styles.
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval'; object-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;" always;

    # Hide Nginx version
    server_tokens off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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
Test and restart Nginx after applying: `sudo nginx -t && sudo systemctl restart nginx`.

## 5. Application-Level Security

### Rate Limiting
To prevent brute-force attacks on the login endpoint, use a library like `express-rate-limit`.

**Example Implementation:**
```javascript
// In backend/src/app.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10, // Limit each IP to 10 login requests per windowMs
	standardHeaders: true,
	legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
});

// Apply to the login route
app.use('/api/auth/login', loginLimiter);
```

### Two-Factor Authentication (2FA)
While not implemented in this demo, adding 2FA is a highly effective security measure. The process would involve:
1.  **Library:** Use a library like `speakeasy` to generate TOTP (Time-based One-Time Password) secrets.
2.  **Setup:** When a user enables 2FA, generate a secret for them. Use the `qrcode` library to display this secret as a QR code they can scan with an authenticator app (like Google Authenticator or Authy).
3.  **Verification:** On login, after validating the password, prompt the user for the 6-digit code from their app. Verify it using `speakeasy.totp.verify()`.

## 6. Docker Image Vulnerability Scanning
Before deploying your backend container, you should scan its image for known vulnerabilities. `Trivy` is a popular and easy-to-use tool for this.

**Installation:**
```bash
sudo apt-get install wget apt-transport-https gnupg lsb-release
wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
echo "deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
sudo apt-get update
sudo apt-get install trivy
```

**Usage:**
After building your backend image with `docker compose build`, you can scan it:
```bash
# The image name is typically <directory-name>-<service-name>
trivy image backend-dashboard-api
```
This will provide a report of any CVEs found in your image's OS packages and application dependencies, allowing you to fix them before deployment.