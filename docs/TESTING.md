# Testing Guide

This guide provides instructions for testing the Docker Manager API using `curl` and the provided integration test script.

### **Prerequisites**

-   `curl` should be installed on your system.
-   `jq` is recommended for pretty-printing JSON responses (`sudo apt-get install jq`).
-   The backend API must be running. These examples assume it's at `http://localhost:3000`.

---

## 1. Automated Integration Test

The most comprehensive way to test the application is to run the built-in integration test script. This script automates the process of logging in, creating, verifying, stopping, and removing a container.

### Running the Script

1.  **Start the Backend:** Make sure your backend server is running.
    ```bash
    # From the /backend directory
    sudo -E node src/app.js
    ```

2.  **Run the Test Script:** In a new terminal, navigate to the root of the project and run the script.
    ```bash
    # Make the script executable (if you haven't already)
    chmod +x test_integration.sh

    # Run the test
    ./test_integration.sh
    ```

The script will print its progress and will exit with an error if any step fails.

## 2. Manual API Testing with `curl`

You can also test individual API endpoints manually. This is useful for debugging specific features.

### Step 1: Health Check

This endpoint requires no authentication and is a simple way to verify the API is running.

```bash
curl http://localhost:3000/api/health | jq
```

**Expected Response:**
```json
{
  "status": "UP",
  "timestamp": "..."
}
```

### Step 2: Login and Obtain JWT

Use your admin credentials to log in. We'll store the returned token in a shell variable for subsequent requests.

```bash
# Store your credentials
ADMIN_USER="admin"
ADMIN_PASS="changeme"

# Request a token
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}")

# Extract the token from the response
TOKEN=$(echo $RESPONSE | jq -r .token)

echo "Token: $TOKEN"
```

### Step 3: List Containers

Use the `Authorization: Bearer <TOKEN>` header to make an authenticated request.

```bash
curl -s http://localhost:3000/api/containers \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Step 4: Pull an Image

This endpoint is asynchronous and will return a `202 Accepted` status immediately.

```bash
curl -s -X POST http://localhost:3000/api/images/pull \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"imageName": "alpine:latest"}' | jq
```

**Expected Response:**
```json
{
  "message": "Image pull for 'alpine:latest' started."
}
```
You can verify the image has been pulled by running `docker images` on the host machine a few moments later.
