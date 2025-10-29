# Operations & Maintenance Guide

This document covers ongoing operational tasks for maintaining the Docker Manager Dashboard, especially for deployments managed by the [`vps_setup.sh`](../vps_setup.sh) script.

## 1. Intrusion Detection and Prevention

The `vps_setup.sh` script installs and configures several security monitoring tools. Here’s how to interact with them.

### 1.1. Monitoring Fail2Ban

Fail2Ban is pre-configured with advanced rules. You can monitor its status to see active jails and banned IP addresses.

```bash
# Check the status of all active jails
sudo fail2ban-client status

# Check a specific jail (e.g., for SSH)
sudo fail2ban-client status sshd

# Check a web-related jail (e.g., for XSS attacks)
sudo fail2ban-client status nginx-xss
```

The main log file for Fail2Ban is `/var/log/fail2ban.log`.

### 1.2. Monitoring OSSEC (HIDS)

OSSEC provides real-time host-based intrusion detection.

```bash
# Check the status of the OSSEC service
sudo /var/ossec/bin/ossec-control status

# View live alerts (Ctrl+C to exit)
sudo tail -f /var/ossec/logs/alerts/alerts.log
```

Alerts are also sent to the email address you provided during the `vps_setup.sh` execution.

### 1.3. Running an AIDE Integrity Check

AIDE checks for unauthorized changes to system files. It's good practice to run this periodically.

```bash
# Run a check against the AIDE database
sudo aide.wrapper --check
```

If you have made legitimate changes to the system (e.g., updated a package), you will need to update the AIDE database:

```bash
# First, run the update command
sudo aide.wrapper --update

# Then, replace the old database with the new one
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
```

## 2. Nginx Reverse Proxy Management

The application includes a feature to manage Nginx reverse proxies for other Docker containers. This is handled by a cron job that runs every 5 minutes.

### 2.1. How It Works

1.  **API Request:** When you create a new reverse proxy in the DockerMist UI, the backend API writes a "pending" task to `/var/lib/nginx-tasks/nginx-tasks.json`.
2.  **Cron Job:** A cron job running as your non-root user executes the `/usr/local/bin/process_nginx_tasks.sh` script.
3.  **Task Processing:** The script reads the JSON file, generates the Nginx configuration, uses Certbot to obtain an SSL certificate (if requested), and reloads Nginx.
4.  **Status Update:** The task status in the JSON file is updated to "active".

### 2.2. Monitoring the Nginx Task Processor

If you encounter issues with the reverse proxy feature, you can check the log file for the task processor:

```bash
# View the log for the Nginx task processor
tail -f /var/log/nginx-task-processor.log
```

This log will show you the script's activity, including any errors it encountered while processing tasks.

## 3. Backups

Regular backups are critical for disaster recovery.

### 3.1. Application Data

The most important data is in the `backend/data` directory, which contains `users.json` and logs.

**Manual Backup Command:**

```bash
# Create a timestamped backup archive
tar -czvf ~/backups/backend_data_$(date +%F).tar.gz /path/to/your/backend/data
```

This command should be automated with a cron job.

### 3.2. System Configuration

It is also wise to back up critical system configurations:

```bash
# Back up Nginx configs
sudo cp -r /etc/nginx ~/backups/nginx_$(date +%F)

# Back up Let's Encrypt certificates
sudo cp -r /etc/letsencrypt ~/backups/letsencrypt_$(date +%F)
```

## 4. System Monitoring

### 4.1. Application Logs

You can view the backend application logs to diagnose errors.

**If using Docker Compose:**

```bash
# In your /backend directory
docker compose logs -f
```

**If using systemd:**

```bash
sudo journalctl -u docker-manager-api.service -f
```

### 4.2. System Logs

Other useful logs to monitor:

```bash
# Nginx error log
tail -f /var/log/nginx/error.log

# System authentication log (for SSH attempts)
tail -f /var/log/auth.log

# Firewall log
tail -f /var/log/ufw.log
```

### 4.3. Health Check

You can use an external uptime monitoring service to ping the API's health check endpoint. This ensures your service is online and responsive.

`https://api.your-domain.com/api/health`

A `200 OK` response indicates the service is running correctly.
