# Security Guide

DockerMist is designed with a defense-in-depth security model. This guide details the security layers that are automatically configured when you use the recommended [`vps_setup.sh`](../vps_setup.sh) script.

## Host Security

The `vps_setup.sh` script automates the hardening of the host server.

### Intrusion Detection & Prevention

-   **OSSEC (Host-based IDS):** A powerful HIDS that performs real-time log analysis, file integrity checking, rootkit detection, and active response. It is installed and configured to send alerts for suspicious activity.
-   **AIDE (File Integrity Monitoring):** AIDE creates a database of your system's file signatures. It is used to detect unauthorized modifications to critical files.
-   **Fail2Ban (Intrusion Prevention):** Fail2Ban is configured with advanced rules to protect against:
    -   Brute-force SSH attacks.
    -   Web-based attacks on Nginx (XSS, SQLi).
    -   Bad bots and scanners.
-   **UFW Firewall:** The Uncomplicated Firewall is configured to deny all incoming traffic by default, only allowing SSH, HTTP, and HTTPS. SSH access is rate-limited to prevent brute-force attacks.

### System & Kernel Hardening

-   **SSH Hardening:** SSH is configured to deny root login and password-based authentication, enforcing the use of SSH keys.
-   **Kernel Tuning (`sysctl`):** The script applies a hardened kernel configuration to protect against common network-level attacks like IP spoofing, SYN floods, and Martians.
-   **Automatic Security Updates:** The `unattended-upgrades` package is configured to automatically install the latest security patches, ensuring your server stays protected against known vulnerabilities.

## Application Security

### Authentication & Secrets

-   **JWT Authentication:** The API uses JSON Web Tokens for secure, stateless authentication.
-   **Secure JWT & Encryption Secrets:** You must provide long, random secrets in your `.env` file for signing tokens (`JWT_SECRET`) and encrypting data (`ENCRYPTION_SECRET`).
    ```bash
    # Use this command to generate a strong secret
    openssl rand -base64 32
    ```
-   **Encrypted Data:** Sensitive information, such as GitHub Personal Access Tokens, is encrypted at rest in `users.json` using AES-256.

### Web & Network Security

-   **Nginx Reverse Proxy:** All API traffic is proxied through a hardened Nginx server, which handles SSL termination and provides an additional layer of security.
-   **Hardened SSL/TLS:** The Nginx configuration is set up with an A+ grade SSL configuration from SSL Labs, using strong ciphers (TLSv1.2, TLSv1.3) and security headers.
-   **Security Headers:** The Nginx configuration includes important security headers:
    -   `Strict-Transport-Security` (HSTS) to enforce HTTPS.
    -   `X-Frame-Options` to prevent clickjacking.
    -   `X-Content-Type-Options` to prevent MIME-sniffing.
    -   `Content-Security-Policy` (CSP) to mitigate XSS attacks.
-   **Restricted CORS Origin:** The `CORS_ORIGIN` in your `.env` file must be set to the exact domain of your frontend to prevent other websites from making requests to your API.

### Atomic and Secure Nginx Configuration Management

The Nginx management feature is secured against command injection, corrupted configurations, and race conditions through a robust, multi-step process handled by the `/usr/local/bin/process_nginx_tasks.sh` script:

1.  **Strict Input Validation:** All domain names are validated at the API level using a strict regular expression to prevent path traversal and command injection attacks. A second validation layer exists within the processing script itself.
2.  **Atomic File Operations:**
    -   New Nginx configurations are first written to a temporary (`.tmp`) file.
    -   The script tests the *entire* Nginx configuration using `nginx -t` *before* activating the new site.
    -   Only if the test is successful is the temporary file atomically moved into place, and the site is enabled. This prevents a corrupted or invalid file from ever being loaded by Nginx.
3.  **Automatic Rollback:** If the `nginx -t` configuration test fails at any point (either during creation or after a failed Certbot operation), the script automatically rolls back the changes by removing the invalid configuration file and symlink.
4.  **Automated Backups:** Before any existing Nginx configuration file is deleted, a timestamped backup is created in `/var/backups/nginx/`, allowing for manual restoration if needed.
5.  **Secure Subprocess Execution:** The script avoids direct shell execution with user input. It uses validated domain names only as file paths, not as command arguments.
6.  **Detailed Logging:** All actions, including shell command outputs (`stdout` and `stderr`), are logged to `/var/log/nginx-task-processor.log`, providing a clear audit trail for debugging and security analysis.
7.  **Concurrency Control:** A lock file mechanism (`flock`) ensures that only one instance of the processing script can run at a time, preventing race conditions.

### Vulnerability Management

-   **Rate Limiting:** The `vps_setup.sh` script does not configure application-level rate limiting by default, but it is a recommended practice. You can add it to your `backend/src/app.js` to protect against brute-force attacks on the login endpoint.
-   **Docker Image Scanning:** Before deploying, it is recommended to scan your Docker images for known vulnerabilities using a tool like `Trivy`.
    ```bash
    # After building your image
    trivy image your-image-name:tag
    ```

## Container & Docker Security

### Docker Socket Protection

The Docker socket (`/var/run/docker.sock`) provides root-equivalent access to the host. DockerMist's architecture is designed to minimize this risk:
-   **No TCP Exposure:** The application communicates with the Docker daemon via the local Unix socket, which is much more secure than exposing the socket over TCP.
-   **Single-Host Architecture:** The backend is designed to run on the same machine as the Docker daemon it manages.

### Container Hardening

-   **Non-Root User:** The backend `Dockerfile` is configured to run the application as a non-root user (`node`), reducing the impact of a potential container compromise.
-   **Security Overrides:** A `docker-compose.security.yml` file is provided to apply additional security settings, such as dropping unnecessary Linux capabilities and setting resource limits.
    ```bash
    # Example of using the security override
    docker-compose -f docker-compose.yml -f ~/docker-compose.security.yml up -d
    ```

---

By leveraging the `vps_setup.sh` script, your deployment benefits from a robust, multi-layered security posture from the start.
