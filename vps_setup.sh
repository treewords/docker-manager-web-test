#!/bin/bash

# ==============================================================================
# Docker Manager Dashboard - Comprehensive VPS Security Setup Script
# ==============================================================================
#
# This script automates the security hardening and environment setup for the
# backend deployment on a fresh Ubuntu 22.04 server. It incorporates best
# practices from DEPLOYMENT.md, SECURITY.md, and ADVANCED_SECURITY.md.
#
# USAGE:
# 1. Upload this script to your new VPS as the root user:
#    scp vps_setup.sh root@YOUR_VPS_IP:/root/
# 2. Connect to the VPS as root.
# 3. Make the script executable: chmod +x vps_setup.sh
# 4. Run the script: ./vps_setup.sh
#
# The script will prompt you for necessary information like the new username
# and your domain name.
#
# WARNING: This script will modify system configuration files. It is
# intended to be run on a new, clean server. Review the script carefully
# before executing.
#
# ==============================================================================

set -e
set -u

# --- Function Declarations ---

# Configure kernel security parameters
setup_kernel_hardening() {
    echo "--- [2/13] Hardening kernel security parameters ---"
    
    cat > /etc/sysctl.d/99-security-hardening.conf << 'EOF'
# IP Spoofing protection
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv6.conf.default.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv6.conf.default.accept_source_route = 0

# Log Martians (packets with impossible addresses)
net.ipv4.conf.all.log_martians = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0

# Ignore Directed pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Enable TCP/IP SYN cookies (protection against SYN flood attacks)
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Disable IPv6 if not needed (optional - remove these lines if you use IPv6)
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1

# Increase system file descriptor limit
fs.file-max = 65535

# Protect against time-wait assassination
net.ipv4.tcp_rfc1337 = 1

# Kernel hardening
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.yama.ptrace_scope = 2
EOF

    sysctl -p /etc/sysctl.d/99-security-hardening.conf >/dev/null 2>&1
    echo "Kernel security parameters applied."
}

# Populates the user and SSH hardening logic
setup_user_and_ssh() {
    echo "--- [3/13] Creating user and hardening SSH ---"
    if id "$NEW_USER" &>/dev/null; then
        echo "User $NEW_USER already exists. Skipping user creation."
    else
        adduser --disabled-password --gecos "" "$NEW_USER"
        echo "User $NEW_USER created."
    fi

    usermod -aG sudo "$NEW_USER"
    echo "User $NEW_USER added to sudo group."

    echo "Please provide the public SSH key for the new user '$NEW_USER'."
    read -p "Paste the entire public key (e.g., 'ssh-rsa AAAA...'): " SSH_KEY

    if [ -n "$SSH_KEY" ]; then
        if echo "$SSH_KEY" | grep -qE "^ssh-(rsa|ed25519|ecdsa)"; then
            echo "Configuring SSH key for $NEW_USER..."
            mkdir -p "/home/$NEW_USER/.ssh"
            echo "$SSH_KEY" > "/home/$NEW_USER/.ssh/authorized_keys"
            chown -R "$NEW_USER:$NEW_USER" "/home/$NEW_USER/.ssh"
            chmod 700 "/home/$NEW_USER/.ssh"
            chmod 600 "/home/$NEW_USER/.ssh/authorized_keys"
            echo "SSH key added successfully for $NEW_USER."
        else
            echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
            echo "!!! WARNING: SSH key provided does not match expected format."
            echo "!!! Expected format: ssh-rsa, ssh-ed25519, or ssh-ecdsa"
            echo "!!! SSH key was NOT saved. Please try again with a valid key."
            echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        fi
    else
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
        echo "!!! WARNING: No SSH key provided for $NEW_USER."
        echo "!!! You will NOT be able to log in as this user via SSH"
        echo "!!! with key-based authentication until you add a key manually."
        echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    fi

    echo "Hardening SSH configuration..."
    sed -i -E 's/^#?PermitRootLogin\s+.*/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i -E 's/^#?PasswordAuthentication\s+.*/PasswordAuthentication no/' /etc/ssh/sshd_config
    sed -i -E 's/^#?PubkeyAuthentication\s+.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
    sed -i -E 's/^#?ChallengeResponseAuthentication\s+.*/ChallengeResponseAuthentication no/' /etc/ssh/sshd_config
    sed -i -E 's/^#?UsePAM\s+.*/UsePAM yes/' /etc/ssh/sshd_config
    sed -i -E 's/^#?X11Forwarding\s+.*/X11Forwarding no/' /etc/ssh/sshd_config
    sed -i -E 's/^#?MaxAuthTries\s+.*/MaxAuthTries 3/' /etc/ssh/sshd_config
    sed -i -E 's/^#?ClientAliveInterval\s+.*/ClientAliveInterval 300/' /etc/ssh/sshd_config
    sed -i -E 's/^#?ClientAliveCountMax\s+.*/ClientAliveCountMax 2/' /etc/ssh/sshd_config
    sed -i -E 's/^#?PermitEmptyPasswords\s+.*/PermitEmptyPasswords no/' /etc/ssh/sshd_config
    sed -i -E 's/^#?Protocol\s+.*/Protocol 2/' /etc/ssh/sshd_config
    
    # Add if not present
    grep -q "^AllowUsers" /etc/ssh/sshd_config || echo "AllowUsers $NEW_USER" >> /etc/ssh/sshd_config

    systemctl restart sshd
    echo "SSH hardened: Root login and password authentication disabled."
    echo "SSH hardening complete with multiple security layers."
}

# Installs all required packages and configures the firewall
setup_firewall_and_dependencies() {
    echo "--- [4/13] Installing dependencies ---"

    echo "Checking for and waiting on existing apt-get locks..."
    while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1 || fuser /var/lib/apt/lists/lock >/dev/null 2>&1 ; do
        echo "Waiting for other package management process to finish..."
        sleep 5
    done
    echo "No active apt-get locks found. Proceeding with installation."

    apt-get update

    echo "Pre-configuring packages to be non-interactive..."
    echo "postfix postfix/main_mailer_type select Local only" | debconf-set-selections
    echo "postfix postfix/mailname string localhost" | debconf-set-selections
    export DEBIAN_FRONTEND=noninteractive

    apt-get install -y ca-certificates curl gnupg apt-transport-https lsb-release debconf-utils

    echo "Installing Docker..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    usermod -aG docker "$NEW_USER"
    echo "User $NEW_USER added to the docker group."
    echo "IMPORTANT: $NEW_USER must log out and log back in for Docker group permissions to apply."

    echo "Installing Nginx, Certbot, HIDS tools, and other dependencies..."
    apt-get install -y nginx certbot python3-certbot-nginx fail2ban aide unattended-upgrades \
                       build-essential make zlib1g-dev libpcre2-dev libevent-dev libssl-dev libsystemd-dev \
                       auditd audispd-plugins rkhunter lynis apticron logwatch postfix mailutils jq
    echo "All dependencies installed."

    echo "--- [5/13] Configuring Firewall (UFW) ---"
    
    # Configure UFW rate limiting for SSH
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw limit 22/tcp comment 'SSH with rate limiting'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    
    # Enable logging
    ufw logging on
    
    ufw --force enable
    echo "Firewall configured with rate limiting and logging enabled."
}

# Configures Fail2Ban with advanced rules for SSH, Nginx, and web attacks
setup_fail2ban() {
    echo "--- [6/13] Configuring Fail2Ban for advanced threat detection ---"

    echo "Creating Fail2Ban filters for Nginx..."
    cat > /etc/fail2ban/filter.d/nginx-xss.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*GET.*(\.|\/|\(|\)|<|>|%22|%3C|%3E|'|%27|`|%60).*
EOF

    cat > /etc/fail2ban/filter.d/nginx-sqli.conf << 'EOF'
[Definition]
failregex = ^<HOST> -.*GET.*(union|select|insert|cast|convert|delete|drop|update|order|by|--|/\*|\*/|#).*
EOF

    echo "Creating jail.local with hardened policies..."
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
maxretry = 3

[nginx-http-auth]
enabled = true
port    = http,https
logpath = %(nginx_error_log)s
maxretry = 3

[nginx-badbots]
enabled = true
port    = http,https
logpath = %(nginx_access_log)s
maxretry = 2

[nginx-xss]
enabled = true
port = http,https
filter = nginx-xss
logpath = %(nginx_access_log)s
maxretry = 2

[nginx-sqli]
enabled = true
port = http,https
filter = nginx-sqli
logpath = %(nginx_access_log)s
maxretry = 2
EOF

    systemctl restart fail2ban
    echo "Fail2Ban configured with advanced rules and restarted."
}

# Configures unattended-upgrades for automatic security patches and initializes AIDE
setup_system_hardening() {
    echo "--- [7/13] Hardening system with AIDE and automatic updates ---"

    echo "Configuring automatic security updates..."
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    echo "Automatic security updates enabled."

    echo "Initializing AIDE database... This is verbose and can take a few minutes."
    local aide_success=false
    if aideinit; then
        if [ -f /var/lib/aide/aide.db.new ]; then
            mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
            echo "AIDE database initialized and activated."
            echo "Run 'aide.wrapper --check' periodically to check for file system changes."
            aide_success=true
        else
            echo "Error: AIDE database file was not created."
        fi
    else
        echo "AIDE initialization failed. Review the output above."
    fi
    
    if [ "$aide_success" = false ]; then
        echo "You can run 'aideinit' manually later to initialize AIDE."
    fi
}

# Installs and configures OSSEC HIDS from source
setup_ossec() {
    echo "--- [8/13] Installing OSSEC Host-based Intrusion Detection System ---"

    local ossec_version="3.7.0"
    local ossec_url="https://github.com/ossec/ossec-hids/archive/refs/tags/${ossec_version}.tar.gz"
    local ossec_archive="ossec-${ossec_version}.tar.gz"
    local ossec_dir="ossec-hids-${ossec_version}"
    local current_dir
    local install_success=false

    current_dir="$(pwd)"

    echo "Downloading OSSEC source..."
    cd /tmp
    wget -q "$ossec_url" -O "$ossec_archive"

    echo "Extracting OSSEC source..."
    tar -xzf "$ossec_archive"

    echo "Automating OSSEC installation..."
    cd "/tmp/${ossec_dir}"

    cat > ./etc/preloaded-vars.conf << EOF
USER_LANGUAGE="en"
USER_INSTALL_TYPE="local"
USER_DIR="/var/ossec"
USER_ENABLE_EMAIL="y"
USER_EMAIL_ADDRESS="${LETSENCRYPT_EMAIL}"
USER_SMTP_SERVER="127.0.0.1"
USER_ENABLE_INTEGRITY="y"
USER_ENABLE_ROOTCHECK="y"
USER_ENABLE_ACTIVE_RESPONSE="y"
USER_ENABLE_SYSLOG="y"
USER_ADD_FIREWALL_RULES="n"
EOF

    if ./install.sh; then
        echo "OSSEC installation completed successfully."
        install_success=true
        
        echo "Starting and enabling OSSEC service..."
        systemctl start ossec.service
        systemctl enable ossec.service
        echo "OSSEC service started and enabled."
    else
        echo "Error: OSSEC installation failed. Check the output above for details."
    fi

    # Cleanup always happens regardless of success/failure
    cd "$current_dir"
    rm -rf "/tmp/${ossec_dir}"
    rm -f "/tmp/${ossec_archive}"
    echo "Cleaned up OSSEC source files."
    
    if [ "$install_success" = false ]; then
        return 1
    fi
}

# Creates a valid Nginx configuration that is ready for Certbot
setup_nginx() {
    echo "--- [9/13] Configuring Nginx reverse proxy ---"

    echo "Creating Nginx configuration for $API_DOMAIN..."
    cat > /etc/nginx/sites-available/$API_DOMAIN << EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    server_tokens off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

    ln -sfn /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/$API_DOMAIN
    rm -f /etc/nginx/sites-enabled/default

    if nginx -t >/dev/null 2>&1; then
        systemctl restart nginx
        echo "Nginx configured and restarted for $API_DOMAIN."
        echo "The server is now ready for you to run Certbot to obtain an SSL certificate."
    else
        echo "Error: Nginx configuration test failed. Please check the configuration."
        return 1
    fi
}

# Automates SSL certificate generation using Certbot
setup_ssl() {
    echo "--- [10/13] Generating SSL certificate with Certbot ---"

    echo "Waiting 10 seconds for DNS propagation..."
    sleep 10

    echo "Requesting SSL certificate for $API_DOMAIN..."
    if certbot --nginx -d "$API_DOMAIN" --agree-tos --no-eff-email --email "$LETSENCRYPT_EMAIL" --non-interactive --redirect; then
        echo "Certbot has successfully generated and installed the SSL certificate."
    else
        echo "Error: Certbot failed to generate SSL certificate. Please verify DNS configuration and try again."
        echo "You can run this command manually later: certbot --nginx -d $API_DOMAIN"
        return 1
    fi
}

# Applies advanced security settings to the Certbot-generated Nginx config (FIXED VERSION)
harden_nginx_ssl() {
    echo "--- [11/13] Applying advanced Nginx hardening ---"

    local nginx_conf="/etc/nginx/sites-available/$API_DOMAIN"
    local letsencrypt_options="/etc/letsencrypt/options-ssl-nginx.conf"

    if [ ! -f "$nginx_conf" ]; then
        echo "Error: Nginx configuration file $nginx_conf not found. Skipping hardening."
        return 1
    fi

    # Create a backup
    cp "$nginx_conf" "${nginx_conf}.backup"

    # Remove any duplicate SSL directives from the site config only
    # (Certbot includes these in /etc/letsencrypt/options-ssl-nginx.conf)
    sed -i '/^[[:space:]]*ssl_protocols/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_prefer_server_ciphers/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_ciphers/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_ecdh_curve/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_session_cache/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_session_tickets/d' "$nginx_conf"
    sed -i '/^[[:space:]]*ssl_stapling/d' "$nginx_conf"

    # Update the Let's Encrypt options file with hardened settings
    # This ensures all SSL settings are in one place and there are no duplicates
    if [ -f "$letsencrypt_options" ]; then
        cp "$letsencrypt_options" "${letsencrypt_options}.backup"
        
        # Remove old SSL directives from the Let's Encrypt file
        sed -i '/^ssl_protocols/d' "$letsencrypt_options"
        sed -i '/^ssl_prefer_server_ciphers/d' "$letsencrypt_options"
        sed -i '/^ssl_ciphers/d' "$letsencrypt_options"
        sed -i '/^ssl_ecdh_curve/d' "$letsencrypt_options"
        sed -i '/^ssl_session_cache/d' "$letsencrypt_options"
        sed -i '/^ssl_session_tickets/d' "$letsencrypt_options"
        sed -i '/^ssl_stapling/d' "$letsencrypt_options"
        
        # Append hardened settings to the Let's Encrypt options file
        cat >> "$letsencrypt_options" << 'EOF'

# Hardened SSL Settings from ADVANCED_SECURITY.md
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers on;
ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
ssl_ecdh_curve secp384r1;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;
EOF
    fi

    # Add security headers to the site config
    awk '
    /ssl_certificate_key/ && !inserted {
        print $0
        print ""
        print "    # Security Headers"
        print "    add_header Strict-Transport-Security \"max-age=63072000; includeSubDomains; preload\" always;"
        print "    add_header X-Content-Type-Options \"nosniff\" always;"
        print "    add_header X-Frame-Options \"SAMEORIGIN\" always;"
        print "    add_header Referrer-Policy \"no-referrer-when-downgrade\" always;"
        print "    add_header Content-Security-Policy \"default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-eval'\''; object-src '\''none'\''; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data:;\" always;"
        inserted=1
        next
    }
    { print }
    ' "$nginx_conf" > "${nginx_conf}.tmp"
    
    mv "${nginx_conf}.tmp" "$nginx_conf"

    echo "Advanced security headers and SSL settings applied to Nginx configuration."

    if nginx -t 2>&1; then
        systemctl reload nginx
        echo "Nginx reloaded with hardened SSL configuration."
    else
        echo "Error: Nginx configuration test failed after hardening."
        echo "Restoring backup configurations..."
        mv "${nginx_conf}.backup" "$nginx_conf"
        if [ -f "${letsencrypt_options}.backup" ]; then
            mv "${letsencrypt_options}.backup" "$letsencrypt_options"
        fi
        systemctl reload nginx
        return 1
    fi
    
    # Remove backups if successful
    rm -f "${nginx_conf}.backup"
    rm -f "${letsencrypt_options}.backup"
}

# Setup Docker security and resource limits
setup_docker_security() {
    echo "--- [12/13] Configuring Docker security settings ---"
    
    # Create Docker daemon configuration
    mkdir -p /etc/docker
    cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "icc": false,
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
EOF

    systemctl restart docker
    echo "Docker security configuration applied."
    
    # Create a docker-compose override template for the user
    cat > "/home/$NEW_USER/docker-compose.security.yml" << 'EOF'
# Add this to your docker-compose.yml for enhanced security
# Usage: docker-compose -f docker-compose.yml -f docker-compose.security.yml up -d

version: '3.8'

services:
  api:
    user: "${UID:-1000}:${GID:-1000}"
    security_opt:
      - no-new-privileges:true
    read_only: false
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
      - DAC_OVERRIDE
    tmpfs:
      - /tmp:noexec,nosuid,size=100M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
EOF

    chown "$NEW_USER:$NEW_USER" "/home/$NEW_USER/docker-compose.security.yml"
    echo "Docker security template created at /home/$NEW_USER/docker-compose.security.yml"
}

# Creates a helper script for setting up the application with systemd
create_systemd_helper_script() {
    echo "--- [13/13] Creating systemd helper script ---"

    cat > "/home/$NEW_USER/setup_systemd.sh" << 'SCRIPT_EOF'
#!/bin/bash

set -e
set -u

if [ "$(id -u)" -eq 0 ]; then
  echo "This script should be run as the application user, not as root. Please run it without sudo."
  exit 1
fi

echo "--- Systemd Service Setup for Docker Manager API ---"

read -p "Please enter the absolute path to your project's 'backend' directory: " BACKEND_PATH

if [ ! -d "$BACKEND_PATH" ] || [ ! -f "$BACKEND_PATH/Dockerfile" ]; then
    echo "Error: The path '$BACKEND_PATH' does not seem to be a valid backend directory."
    echo "It must contain a Dockerfile. Aborting."
    exit 1
fi

APP_USER_ID=$(id -u)
APP_GROUP_ID=$(id -g)

echo "Building the Docker image 'dashboard-api'..."
(cd "$BACKEND_PATH" && docker build -t dashboard-api .)

echo "Creating the systemd service file..."

# Note: We need to substitute variables into the systemd file
# Using a temporary file approach to handle the variable substitution properly
sudo bash << SYSTEMD_EOF
cat > /etc/systemd/system/docker-manager-api.service << 'SERVICE_FILE'
[Unit]
Description=Docker Manager API Service
After=docker.service
Requires=docker.service

[Service]
TimeoutStartSec=0
Restart=always
ExecStartPre=-/usr/bin/docker stop docker-manager-api
ExecStartPre=-/usr/bin/docker rm docker-manager-api
ExecStart=/usr/bin/docker run --rm --name docker-manager-api \\
  --user __APP_USER_ID__:__APP_GROUP_ID__ \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  -p 127.0.0.1:3000:3000 \\
  --env-file __BACKEND_PATH__/.env \\
  dashboard-api

[Install]
WantedBy=multi-user.target
SERVICE_FILE

# Now substitute the variables
sed -i "s|__APP_USER_ID__|${APP_USER_ID}|g" /etc/systemd/system/docker-manager-api.service
sed -i "s|__APP_GROUP_ID__|${APP_GROUP_ID}|g" /etc/systemd/system/docker-manager-api.service
sed -i "s|__BACKEND_PATH__|${BACKEND_PATH}|g" /etc/systemd/system/docker-manager-api.service
SYSTEMD_EOF

echo "Enabling and starting the service..."
sudo systemctl daemon-reload
sudo systemctl enable docker-manager-api.service
sudo systemctl start docker-manager-api.service

echo "Service setup complete."
echo "Run 'sudo systemctl status docker-manager-api.service' to check its status."
echo "Run 'sudo journalctl -u docker-manager-api.service -f' to view logs."

SCRIPT_EOF

    chmod +x "/home/$NEW_USER/setup_systemd.sh"
    chown "$NEW_USER:$NEW_USER" "/home/$NEW_USER/setup_systemd.sh"
    echo "Helper script 'setup_systemd.sh' created in /home/$NEW_USER/"
}

# Provides a summary of the setup and clear next steps for the user
final_summary() {
    echo
    echo "====================================================================="
    echo "--- VPS Security Setup Complete! ---"
    echo "====================================================================="
    echo
    echo "SECURITY LAYERS IMPLEMENTED:"
    echo "✓ Kernel hardening (sysctl parameters)"
    echo "✓ SSH hardening (key-only auth, rate limiting, protocol restrictions)"
    echo "✓ Firewall (UFW with rate limiting and logging)"
    echo "✓ Fail2Ban (SSH, Nginx, XSS, SQLi protection)"
    echo "✓ Automatic security updates"
    echo "✓ AIDE file integrity monitoring"
    echo "✓ OSSEC Host-based Intrusion Detection"
    echo "✓ Nginx with hardened SSL/TLS"
    echo "✓ Docker security configuration"
    echo
    echo "NEXT STEPS:"
    echo
    echo "1. Log In and Clone Repository:"
    echo "   - IMPORTANT: Log out from the root user now ('exit')."
    echo "   - Log back in as the new user: ssh $NEW_USER@<YOUR_VPS_IP>"
    echo "   - As '$NEW_USER', clone your repository and create your '.env' file."
    echo
    echo "2. Choose a Deployment Method:"
    echo "   A) Docker Compose (Recommended):"
    echo "      - Navigate to the 'backend' directory."
    echo "      - OPTIONAL: Merge docker-compose.security.yml for extra security:"
    echo "        docker-compose -f docker-compose.yml -f ~/docker-compose.security.yml up --build -d"
    echo "      - OR use standard deployment:"
    echo "        docker compose up --build -d"
    echo
    echo "   B) Systemd Service (Alternative):"
    echo "      - From your home directory (~), run the helper script:"
    echo "      - ./setup_systemd.sh"
    echo
    echo "3. System Monitoring Commands:"
    echo "   - Check file integrity: sudo aide.wrapper --check"
    echo "   - Check OSSEC status: sudo /var/ossec/bin/ossec-control status"
    echo "   - Check Fail2Ban: sudo fail2ban-client status"
    echo "   - View firewall logs: sudo tail -f /var/log/ufw.log"
    echo "   - Check SSH attempts: sudo journalctl -u ssh -n 50"
    echo
    echo "4. Security Best Practices:"
    echo "   - Regularly update: sudo apt update && sudo apt upgrade"
    echo "   - Monitor logs: sudo journalctl -xe"
    echo "   - Check active connections: sudo netstat -tulpn"
    echo "   - Review OSSEC alerts: sudo tail -f /var/ossec/logs/alerts/alerts.log"
    echo
    echo "-> Your site is now live at: https://$API_DOMAIN"
    echo "-> Log out and log back in as '$NEW_USER' for all changes to take effect."
    echo
    echo "====================================================================="
    echo "For security questions, check: /home/$NEW_USER/docker-compose.security.yml"
    echo "====================================================================="
    echo
}

# --- Script Execution ---

main() {
    echo "--- [1/14] Starting Comprehensive VPS Security Setup ---"

    if [ "$(id -u)" -ne 0 ]; then
      echo "This script must be run as root. Please use 'sudo ./vps_setup.sh' or run as the root user."
      exit 1
    fi

    read -p "Enter the desired username for the new non-root user: " NEW_USER
    while [ -z "$NEW_USER" ]; do
        echo "Username cannot be empty."
        read -p "Enter the desired username for the new non-root user: " NEW_USER
    done

    read -p "Enter the domain/subdomain for the backend API (e.g., api.your-domain.com): " API_DOMAIN
    while [ -z "$API_DOMAIN" ]; do
        echo "Domain name cannot be empty."
        read -p "Enter the domain/subdomain for the backend API (e.g., api.your-domain.com): " API_DOMAIN
    done

    read -p "Enter your email address (for Let's Encrypt SSL certificate): " LETSENCRYPT_EMAIL
    while [ -z "$LETSENCRYPT_EMAIL" ]; do
        echo "Email address cannot be empty."
        read -p "Enter your email address (for Let's Encrypt SSL certificate): " LETSENCRYPT_EMAIL
    done

    echo
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! IMPORTANT !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    echo "Before proceeding, you MUST have a DNS 'A' record for '$API_DOMAIN'"
    echo "that points to this server's public IP address."
    echo "Certbot will fail if the DNS is not configured correctly."
    echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
    read -p "Have you configured the DNS A record for '$API_DOMAIN'? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "DNS not confirmed. Aborting script. Please configure DNS and run again."
        exit 1
    fi

    echo "--------------------------------------------------"
    echo "Configuration:"
    echo "New User: $NEW_USER"
    echo "API Domain: $API_DOMAIN"
    echo "Let's Encrypt Email: $LETSENCRYPT_EMAIL"
    echo "--------------------------------------------------"
    read -p "Press Enter to continue or Ctrl+C to cancel."

    setup_kernel_hardening
    setup_user_and_ssh
    setup_firewall_and_dependencies
    setup_fail2ban
    setup_system_hardening
    setup_ossec
    setup_nginx
    setup_ssl
    harden_nginx_ssl
    setup_docker_security
    create_systemd_helper_script
    final_summary
}

main
