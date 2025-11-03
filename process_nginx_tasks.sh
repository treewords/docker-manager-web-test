#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.
set -o pipefail # The return value of a pipeline is the status of the last command to exit with a non-zero status.

# --- Configuration ---
TASKS_FILE="/var/lib/nginx-tasks/nginx-tasks.json"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
LOG_FILE="/var/log/nginx-task-processor.log"
LOCK_FILE="/var/lib/nginx-tasks/nginx-task-processor.lock"
BACKUP_DIR="/var/backups/nginx"
# This email is a placeholder and is dynamically replaced by vps_setup.sh during installation
CERTBOT_EMAIL="admin@example.com"

# --- Initialization ---
# Ensure log, backup and lock directories exist
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "$BACKUP_DIR"
mkdir -p "$(dirname "$LOCK_FILE")"

# --- Lock File ---
# Redirect file descriptor 200 to the lock file.
exec 200>"$LOCK_FILE"
# Try to acquire an exclusive lock on fd 200 without blocking. If the lock is held, exit.
flock -n 200 || { echo "Another instance is running. Exiting."; exit 1; }
# Set a trap to automatically release the lock and remove the file when the script exits.
trap 'flock -u 200; rm -f "$LOCK_FILE"' EXIT

# --- Logging ---
log() {
    # Appends a timestamped message to the log file.
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# --- Validation ---
is_valid_domain() {
    # Validates a domain name against a strict regex to prevent injection.
    local domain=$1
    if [[ "$domain" =~ ^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+$ ]]; then
        return 0
    else
        return 1
    fi
}

# --- Error Handling ---
handle_error() {
    # Updates a task's status to "failed" in the JSON file.
    local task_id=$1
    local error_message=$2
    log "ERROR for task $task_id: $error_message"
    # Use jq to atomically update the status and error message for the specific task
    jq "map(if .id == \"$task_id\" then .status = \"failed\" | .error = \"$error_message\" else . end)" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
}

# --- Main Processing Logic ---
log "Starting Nginx task processing."

if [ ! -f "$TASKS_FILE" ]; then
    log "Task file not found: $TASKS_FILE. Exiting."
    exit 0
fi

# --- Process Pending Tasks (Creations) ---
jq -c '.[] | select(.status == "pending")' "$TASKS_FILE" | while read -r task; do
    # Extract task details safely using jq
    TASK_ID=$(echo "$task" | jq -r '.id')
    DOMAIN=$(echo "$task" | jq -r '.domain')
    PROXY_PASS=$(echo "$task" | jq -r '.proxyPass')
    ENABLE_SSL=$(echo "$task" | jq -r '.enableSSL')

    # Set up a specific trap for this task to catch any unexpected command failures
    trap 'handle_error "$TASK_ID" "An unexpected error occurred during creation."; trap - ERR; continue' ERR

    log "Processing PENDING task $TASK_ID for domain $DOMAIN"

    # 1. Secondary Validation
    if ! is_valid_domain "$DOMAIN"; then
        handle_error "$TASK_ID" "Invalid domain format rejected by script-level validation."
        continue
    fi

    # Define file paths
    CONFIG_FILE="$NGINX_SITES_AVAILABLE/$DOMAIN"
    CONFIG_FILE_TMP="${CONFIG_FILE}.tmp"

    if [ -f "$CONFIG_FILE" ]; then
        handle_error "$TASK_ID" "Nginx configuration file already exists for this domain."
        continue
    fi

    # 2. Generate Nginx Config to a temporary file for atomic operation
    log "Generating Nginx config for $DOMAIN into temporary file."
    cat > "$CONFIG_FILE_TMP" <<EOL
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

    # 3. Move temp file to final destination and enable the site
    log "Moving temporary config to $CONFIG_FILE and enabling site."
    sudo mv "$CONFIG_FILE_TMP" "$CONFIG_FILE"
    sudo ln -sf "$CONFIG_FILE" "$NGINX_SITES_ENABLED/"

    # 4. Test the entire Nginx Configuration before reloading
    log "Testing Nginx configuration..."
    if ! sudo nginx -t &>> "$LOG_FILE"; then
        log "Nginx configuration test failed for $DOMAIN. Rolling back."
        # Rollback: remove symlink and config file
        sudo rm -f "$NGINX_SITES_ENABLED/$DOMAIN"
        sudo rm -f "$CONFIG_FILE"
        handle_error "$TASK_ID" "Nginx configuration test failed. Rolled back changes."
        continue
    fi
    log "Nginx configuration test successful."

    # 5. Obtain SSL Certificate (if enabled)
    if [ "$ENABLE_SSL" = "true" ]; then
        log "Requesting SSL certificate for $DOMAIN"
        if ! sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$CERTBOT_EMAIL" &>> "$LOG_FILE"; then
            log "Certbot failed for $DOMAIN. Rolling back."
            # Rollback: remove symlink and config file
            sudo rm -f "$NGINX_SITES_ENABLED/$DOMAIN"
            sudo rm -f "$CONFIG_FILE"
            # Certbot can leave a broken config, so test again to be safe
            sudo nginx -t &>> "$LOG_FILE" || log "WARNING: Nginx config is broken after certbot failure."
            handle_error "$TASK_ID" "Certbot failed to obtain SSL certificate. Rolled back changes."
            continue
        fi
        log "SSL certificate obtained successfully for $DOMAIN."
    fi

    # 6. Reload Nginx using the robust command
    log "Reloading Nginx..."
    if ! (sudo systemctl reload nginx || sudo nginx -s reload) &>> "$LOG_FILE"; then
        handle_error "$TASK_ID" "Nginx reload command failed. The configuration is valid but the service could not be reloaded."
        continue
    fi
    log "Nginx reloaded successfully."

    # 7. Update Task Status to 'active'
    jq "map(if .id == \"$TASK_ID\" then .status = \"active\" else . end)" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
    log "Updated task $TASK_ID status to 'active'."

    trap - ERR # Clear the trap for the next iteration
done

# --- Process Deletion Tasks ---
jq -c '.[] | select(.status == "deleting")' "$TASKS_FILE" | while read -r task; do
    TASK_ID=$(echo "$task" | jq -r '.id')
    DOMAIN=$(echo "$task" | jq -r '.domain')

    trap 'handle_error "$TASK_ID" "An unexpected error occurred during deletion."; trap - ERR; continue' ERR

    log "Processing DELETING task $TASK_ID for domain $DOMAIN"

    CONFIG_FILE="$NGINX_SITES_AVAILABLE/$DOMAIN"

    # 1. Backup before deleting
    if [ -f "$CONFIG_FILE" ]; then
        BACKUP_FILE="$BACKUP_DIR/$(date +%s)_${DOMAIN}.conf.backup"
        log "Backing up $CONFIG_FILE to $BACKUP_FILE"
        sudo cp "$CONFIG_FILE" "$BACKUP_FILE" &>> "$LOG_FILE"
    fi

    # 2. Disable and Remove Site
    log "Disabling site: $DOMAIN"
    sudo rm -f "$NGINX_SITES_ENABLED/$DOMAIN" &>> "$LOG_FILE"
    log "Removing site configuration: $CONFIG_FILE"
    sudo rm -f "$CONFIG_FILE" &>> "$LOG_FILE"

    # 3. Delete SSL Certificate if it exists
    if sudo certbot certificates -d "$DOMAIN" &>> "$LOG_FILE" | grep -q "Found the following certs"; then
        log "Deleting SSL certificate for $DOMAIN"
        sudo certbot delete --cert-name "$DOMAIN" --non-interactive &>> "$LOG_FILE"
    fi

    # 4. Test and Reload Nginx
    log "Testing Nginx configuration after deletion..."
    if ! sudo nginx -t &>> "$LOG_FILE"; then
        log "Nginx configuration test failed after deleting $DOMAIN. Attempting to restore from backup."
        # Rollback from backup if it exists
        if [ -f "$BACKUP_FILE" ]; then
            log "Restoring backup for $DOMAIN."
            sudo cp "$BACKUP_FILE" "$CONFIG_FILE" &>> "$LOG_FILE"
            sudo ln -sf "$CONFIG_FILE" "$NGINX_SITES_ENABLED/"
        fi
        handle_error "$TASK_ID" "Nginx configuration test failed after deletion. Attempted to restore backup."
        continue
    fi

    log "Reloading Nginx after deletion..."
    (sudo systemctl reload nginx || sudo nginx -s reload) &>> "$LOG_FILE"

    # 5. Remove Task from JSON file
    jq "map(select(.id != \"$TASK_ID\"))" "$TASKS_FILE" > "$TASKS_FILE.tmp" && mv "$TASKS_FILE.tmp" "$TASKS_FILE"
    log "Removed task $TASK_ID from task file."

    trap - ERR
done

log "Finished Nginx task processing."
exit 0
