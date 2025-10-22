# Security Checklist & Hardening

This document provides a minimal security checklist for the Docker Manager Dashboard. It is crucial to follow these steps to harden your deployment.

## 1. Do Not Expose the Docker Socket

**Risk:** The backend application requires access to the Docker daemon socket (`/var/run/docker.sock`). Mounting this socket into a container is standard practice for tools that manage Docker, but it is **equivalent to giving root access on the host machine**. If the backend application is ever compromised, an attacker could control your entire host system.

**Mitigations:**
-   **Never expose the Docker socket over TCP without TLS.** The default configuration provided runs the backend on the same host as the Docker daemon and accesses the socket locally, which is a common and acceptable pattern for single-host setups.
-   **Run the backend container as a non-root user.** While the container needs access to the Docker group to use the socket, the application process itself should not run as root. The provided `Dockerfile` uses a non-root user by default.
-   **Alternative for multi-host setups:** For more advanced or distributed setups, do not expose the Docker socket directly. Instead, use a secure API proxy like [Docker Socket Proxy](https://github.com/Tecnativa/docker-socket-proxy) that can provide read-only access or limit the available API calls.

## 2. Secure JWT Secrets

**Risk:** The `JWT_SECRET` is used to sign and verify all authentication tokens. If this secret is leaked, an attacker can forge valid tokens and gain unauthorized access to the API.

**Mitigations:**
-   **Do not use the default secret.** The `.env.example` file contains a placeholder value (`changeme_this_is_not_secure`). You **must** change this.
-   **Use a long, complex, and random string.** A good secret can be generated with a password manager or a command-line tool:
    ```bash
    openssl rand -base64 32
    ```
-   **Do not commit secrets to Git.** Your `.env` file should be listed in `.gitignore` and managed securely on the server. For team environments, use a secret management tool like HashiCorp Vault, Doppler, or AWS Secrets Manager.

## 3. Enforce HTTPS

**Risk:** Without HTTPS, all traffic between the user's browser and your API (including passwords and JWTs) is sent in plaintext, making it vulnerable to interception (Man-in-the-Middle attacks).

**Mitigations:**
-   **Always use a reverse proxy with SSL/TLS.** The provided Nginx and Certbot setup ensures that all communication is encrypted.
-   **Implement HTTP Strict Transport Security (HSTS).** Add the HSTS header in your Nginx configuration to force browsers to only communicate over HTTPS. Add this line inside your `server` block for port 443:
    ```nginx
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    ```

## 4. Restrict CORS Origin

**Risk:** An overly permissive CORS (Cross-Origin Resource Sharing) policy (e.g., `*`) allows any website on the internet to make requests to your API from a user's browser. This can lead to security vulnerabilities.

**Mitigations:**
-   **Specify the exact frontend domain.** In your backend's `.env` file, set `CORS_ORIGIN` to the precise URL of your frontend application (e.g., `https://your-domain.com`). Do not include a trailing slash.

## 5. Harden SSH and Firewall

**Risk:** A poorly configured SSH or firewall leaves your server vulnerable to brute-force attacks and unauthorized access.

**Mitigations:**
-   **Disable root login:** As detailed in the deployment guide, you should disable direct `root` login over SSH (`PermitRootLogin no`).
-   **Use SSH keys instead of passwords.** Password-based authentication is more susceptible to brute-force attacks.
-   **Configure UFW correctly:** Only allow traffic on necessary ports (22, 80, 443). All other ports should be blocked by default.
-   **Install Fail2Ban:** As detailed in the operations guide, Fail2Ban automatically blocks IPs that show signs of malicious activity, providing an extra layer of defense against brute-force attacks.

## 6. Change Default Credentials and Rotate Secrets

**Risk:** Using default or long-lived credentials increases the risk of unauthorized access if they are ever compromised.

**Mitigations:**
-   **Change the initial admin password.** The `ADMIN_PASSWORD` in the `.env` file is for initial setup only. It is highly recommended to have a mechanism to change user passwords (though not implemented in this demo).
-   **Periodically rotate the `JWT_SECRET`.** If you suspect a breach or as part of good security hygiene, generate a new `JWT_SECRET`. Note that rotating the secret will invalidate all active user sessions, forcing them to log in again.
-   **Regularly review audit logs.** The `audit.log` file in `backend/data/logs` records important actions. Periodically check this file for suspicious activity, such as repeated failed login attempts from a specific user.

---

## Next Steps: Advanced Hardening

For users looking to implement even stronger security measures, please refer to the **[ADVANCED_SECURITY.md](./ADVANCED_SECURITY.md)** guide. It covers topics such as:
-   Advanced intrusion prevention with Fail2Ban.
-   Host-based intrusion detection with AIDE.
-   Automatic security updates.
-   Hardened Nginx configuration with stronger SSL/TLS.
-   Application-level rate limiting.
-   Docker image vulnerability scanning.