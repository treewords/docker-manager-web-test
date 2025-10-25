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

# Populates the user and SSH hardening logic
setup_user_and_ssh() {
    echo "--- [2/12] Creating user and hardening SSH ---"
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

    systemctl restart sshd
    echo "SSH hardened: Root login and password authentication disabled."
}

# Installs all required packages and configures the firewall
setup_firewall_and_dependencies() {
    echo "--- [3/12] Installing dependencies ---"
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
    apt-get install -y fail2ban aide unattended-upgrades \
                       build-essential make zlib1g-dev libpcre2-dev libevent-dev libssl-dev libsystemd-dev
    echo "All dependencies installed."

    echo "--- [4/12] Configuring Firewall (UFW) ---"
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    echo "Firewall configured and enabled to allow SSH, HTTP, and HTTPS traffic."
}

# Configures Fail2Ban with advanced rules for SSH, Nginx, and web attacks
setup_fail2ban() {
    echo "--- [5/12] Configuring Fail2Ban for advanced threat detection ---"

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
    echo "--- [6/12] Hardening system with AIDE and automatic updates ---"

    echo "Configuring automatic security updates..."
    cat > /etc/apt/apt.conf.d/20auto-upgrades << EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
EOF
    echo "Automatic security updates enabled."

    echo "Initializing AIDE database... This is verbose and can take a few minutes."
    if aideinit; then
        if [ -f /var/lib/aide/aide.db.new ]; then
            mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
            echo "AIDE database initialized and activated."
            echo "Run 'aide.wrapper --check' periodically to check for file system changes."
        else
            echo "Error: AIDE database file was not created. Skipping activation."
        fi
    else
        echo "AIDE initialization failed. Review the output above and run 'aideinit' manually to debug if necessary."
    fi
}

# Installs and configures OSSEC HIDS from source
setup_ossec() {
    echo "--- [7/12] Installing OSSEC Host-based Intrusion Detection System ---"

    local ossec_version="3.7.0"
    local ossec_url="https://github.com/ossec/ossec-hids/archive/refs/tags/${ossec_version}.tar.gz"
    local ossec_archive="ossec-${ossec_version}.tar.gz"
    local ossec_dir="ossec-hids-${ossec_version}"
    local current_dir

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
    else
        echo "Error: OSSEC installation failed. Check the output above for details."
        cd "$current_dir"
        return 1
    fi

    echo "Starting and enabling OSSEC service..."
    systemctl start ossec.service
    systemctl enable ossec.service
    echo "OSSEC service started and enabled."

    cd "$current_dir"
    rm -rf "/tmp/${ossec_dir}"
    rm -f "/tmp/${ossec_archive}"
    echo "Cleaned up OSSEC source files."
}

# Creates a helper script for setting up the application with systemd
create_systemd_helper_script() {
    echo "--- [11/12] Creating systemd helper script ---"

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

echo "Building the Docker image 'dashboard-api'..."
(cd "$BACKEND_PATH" && docker build -t dashboard-api .)

echo "Creating the systemd service file..."

sudo bash -c 'cat > /etc/systemd/system/docker-manager-api.service' << 'SYSTEMD_EOF'
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
  -v ${BACKEND_PATH}/data:/usr/src/app/data \
  -p 127.0.0.1:3000:3000 \
  --env-file ${BACKEND_PATH}/.env \
  dashboard-api

[Install]
WantedBy=multi-user.target
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
    echo "--- [12/12] VPS Security Setup Complete! ---"
    echo "====================================================================="
    echo
    echo "The server has been hardened and configured. Here are your next steps:"
    echo
    echo "1. Log In and Clone Repository:"
    echo "   - IMPORTANT: Log out from the root user now ('exit')."
    echo "   - Log back in as the new user: ssh $NEW_USER@<YOUR_VPS_IP>"
    echo "   - As '$NEW_USER', clone your repository and create your '.env' file."
    echo
    echo "2. Choose a Deployment Method:"
    echo "   A) Docker Compose (Recommended):"
    echo "      - Navigate to the 'backend' directory."
    echo "      - Run the application with: docker compose up --build -d"
    echo
    echo "   B) Systemd Service (Alternative):"
    echo "      - From your home directory (~), run the helper script we created:"
    echo "      - ./setup_systemd.sh"
    echo "      - Follow the prompts to provide the path to your 'backend' directory."
    echo
    echo "3. System Monitoring:"
    echo "   - Periodically check for file system changes with: sudo aide.wrapper --check"
    echo "   - Check the status of the OSSEC HIDS with: sudo /var/ossec/bin/ossec-control status"
    echo "   - Check the status of Fail2Ban jails with: sudo fail2ban-client status sshd"
    echo
    echo "-> Your site is now live at: https://$API_DOMAIN"
    echo "-> You must log out and log back in as '$NEW_USER' for all changes to take effect."
    echo
}

# --- Script Execution ---

main() {
    echo "--- [1/12] Starting Comprehensive VPS Security Setup ---"

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

    setup_user_and_ssh
    setup_firewall_and_dependencies
    setup_fail2ban
    setup_system_hardening
    setup_ossec
    create_systemd_helper_script
    final_summary
}

main