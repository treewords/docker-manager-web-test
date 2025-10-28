# Operations Guide

This document covers ongoing operational tasks for maintaining the Docker Manager dashboard.

## 1. Fail2Ban for Intrusion Prevention

Fail2Ban is a crucial security tool that scans log files (e.g., `/var/log/auth.log`) and bans IP addresses that show malicious signs, such as too many password failures or seeking exploits.

### 1.1. Installation

```bash
sudo apt-get update
sudo apt-get install -y fail2ban
```
The service starts automatically upon installation.

### 1.2. Basic Configuration

Default configuration files are in `/etc/fail2ban/`. To make your changes upgrade-proof, create a local override file.

```bash
sudo nano /etc/fail2ban/jail.local
```

Paste the following configuration to create a basic jail for SSH. This will ban an IP for 10 minutes after 5 failed login attempts within a 10-minute window.

```ini
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 5
bantime = 600
```

For web traffic, you can create a jail to protect Nginx from bots and basic DoS attacks. Add this to your `jail.local` file:

```ini
[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/access.log
filter  = nginx-http-auth
maxretry = 3
bantime = 600

[nginx-badbots]
enabled = true
port    = http,https
logpath = /var/log/nginx/access.log
filter  = nginx-badbots
maxretry = 2
bantime = 3600
```

After configuring, restart Fail2Ban to apply the changes:
```bash
sudo systemctl restart fail2ban
```

### 1.3. Monitoring Fail2Ban

To check the status of a specific jail (e.g., `sshd`):
```bash
sudo fail2ban-client status sshd
```
This command will show you a list of currently banned IP addresses.

## 2. Backups

### 2.1. Backend Data

The most critical data to back up is located in the `backend/data/` directory on your VPS. This contains:
- `users.json`: Your user database with hashed passwords.
- `logs/`: Application and audit logs, which can be useful for security reviews.

A simple backup strategy is to create a compressed archive of this directory and store it securely.

**Manual Backup Command:**
```bash
# Ensure you have a backups directory
mkdir -p ~/backups

# Create a timestamped backup
tar -czvf ~/backups/backend_data_$(date +%F).tar.gz /path/to/your/backend/data
```
For automation, this command should be run as a cron job.

### 2.2. Nginx Configuration

Your Nginx configurations are also important to back up.
```bash
sudo cp /etc/nginx/sites-available/api.your-domain.com ~/backups/
```

## 3. Monitoring

### 3.1. Application Logs

Regularly check the application logs for errors or unexpected behavior.

**If using Docker Compose:**
```bash
cd /path/to/your/backend
docker compose logs -f dashboard-api
```

**If using systemd:**
```bash
sudo journalctl -u docker-manager-api.service -f
```

### 3.2. Nginx Logs

Nginx logs are essential for diagnosing connectivity or proxy issues.
```bash
# Check for errors
tail -f /var/log/nginx/error.log

# Check access logs
tail -f /var/log/nginx/access.log
```

### 3.3. Health Check Endpoint

You can use an external monitoring service (like UptimeRobot) to ping the health check endpoint to ensure your API is online.
`https://api.your-domain.com/api/health`
A `200 OK` response indicates the service is running.