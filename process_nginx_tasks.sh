#!/bin/bash

# This script processes Nginx tasks from a JSON file.
# It should be run by a cron job on the host machine.

set -o pipefail

# --- Configuration ---
# The user running this script must have passwordless sudo access for the following commands:
# - systemctl reload nginx
# - certbot
# - ln
# - rm

TASKS_FILE="/var/lib/nginx-tasks/nginx-tasks.json"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
LOG_FILE="/var/log/nginx-task-processor.log"
LOCK_FILE="/var/run/nginx-task-processor.lock"
# IMPORTANT: Change this to a valid email address for Certbot notifications.
CERTBOT_EMAIL="admin@example.com"

# --- Lock File ---
if [ -f "$LOCK_FILE" ]; then
    echo "Lock file exists, another instance is running."
    exit 1
fi
trap 'rm -f "$LOCK_FILE"' EXIT
touch "$LOCK_FILE"

# --- Logging ---
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# --- Validation ---
is_valid_domain() {
    local domain=$1
    # Basic domain validation regex
    if [[ "$domain" =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# --- Error Handling ---
handle_error() {
    local task_id=$1
    local error_message=$2
    log "ERROR: $error_message"
    jq "map(if .id == \"$task_id\" then .status = \"failed\" | .error = \"$error_message\" else . end)" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
}

# --- Main Processing Logic ---
if [ ! -f "$TASKS_FILE" ]; then
    log "Task file not found: $TASKS_FILE"
    exit 0
fi

# --- Process Pending Tasks ---
jq -c '.[] | select(.status == "pending")' "$TASKS_FILE" | while read -r task; do
    TASK_ID=$(echo "$task" | jq -r '.id')
    DOMAIN=$(echo "$task" | jq -r '.domain')
    PROXY_PASS=$(echo "$task" | jq -r '.proxyPass')
    ENABLE_SSL=$(echo "$task" | jq -r '.enableSSL')

    trap 'handle_error "$TASK_ID" "An unexpected error occurred."' ERR

    log "Processing task $TASK_ID for domain $DOMAIN"

    # --- Validate Domain ---
    if ! is_valid_domain "$DOMAIN"; then
        handle_error "$TASK_ID" "Invalid domain format."
        continue
    fi
    CONFIG_FILE="$NGINX_SITES_AVAILABLE/$DOMAIN"
    if [ -f "$CONFIG_FILE" ]; then
        handle_error "$TASK_ID" "Nginx configuration file already exists for this domain."
        continue
    fi

    # --- Generate Nginx Config ---
    CONFIG_FILE="$NGINX_SITES_AVAILABLE/$DOMAIN"
    cat > "$CONFIG_FILE" <<EOL
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass $PROXY_PASS;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOL

    log "Generated Nginx config for $DOMAIN"

    # --- Enable Site ---
    sudo ln -sf "$CONFIG_FILE" "$NGINX_SITES_ENABLED/"
    log "Enabled site for $DOMAIN"

    # --- Obtain SSL Certificate (if enabled) ---
    if [ "$ENABLE_SSL" = "true" ]; then
        log "Requesting SSL certificate for $DOMAIN"
        if ! sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL"; then
            handle_error "$TASK_ID" "Certbot failed to obtain SSL certificate."
            continue
        fi
        log "SSL certificate obtained for $DOMAIN"
    fi

    # --- Reload Nginx ---
    if ! sudo nginx -t; then
        handle_error "$TASK_ID" "Nginx configuration test failed."
        continue
    fi
    sudo systemctl reload nginx
    log "Reloaded Nginx"

    # --- Update Task Status ---
    jq "map(if .id == \"$TASK_ID\" then .status = \"active\" else . end)" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
    log "Updated task $TASK_ID to active"

    trap - ERR
done

# --- Process Deletion Tasks ---
jq -c '.[] | select(.status == "deleting")' "$TASKS_FILE" | while read -r task; do
    TASK_ID=$(echo "$task" | jq -r '.id')
    DOMAIN=$(echo "$task" | jq -r '.domain')

    trap 'handle_error "$TASK_ID" "An unexpected error occurred during deletion."' ERR

    log "Processing deletion for task $TASK_ID for domain $DOMAIN"

    # --- Disable and Remove Site ---
    sudo rm -f "$NGINX_SITES_ENABLED/$DOMAIN"
    sudo rm -f "$NGINX_SITES_AVAILABLE/$DOMAIN"
    log "Disabled and removed site for $DOMAIN"

    # --- Delete SSL Certificate ---
    if sudo certbot certificates -d "$DOMAIN" | grep -q "Found the following certs"; then
        sudo certbot delete --cert-name "$DOMAIN" --non-interactive
        log "Deleted SSL certificate for $DOMAIN"
    fi

    # --- Reload Nginx ---
    if ! sudo nginx -t; then
        handle_error "$TASK_ID" "Nginx configuration test failed after deletion."
        continue
    fi
    sudo systemctl reload nginx
    log "Reloaded Nginx after deletion"

    # --- Remove Task ---
    jq "map(select(.id != \"$TASK_ID\"))" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
    log "Removed task $TASK_ID"

    trap - ERR
done


log "Finished processing tasks."
exit 0
