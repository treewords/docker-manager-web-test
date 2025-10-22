# Testing Guide

This guide provides instructions for testing the Docker Manager API using `curl`. These tests cover all major endpoints and actions.

### **Prerequisites**

-   `curl` should be installed on your system.
-   `jq` is recommended for pretty-printing JSON responses (`sudo apt-get install jq`).
-   The backend API must be running. These examples assume it's at `http://localhost:3000`. Replace this with your production URL if testing remotely.

---

### **Step 1: Health Check**

This endpoint requires no authentication and is a simple way to verify the API is running.

```bash
curl http://localhost:3000/api/health | jq
```

**Expected Response:**
```json
{
  "status": "UP",
  "timestamp": "2023-10-27T10:00:00.000Z"
}
```

---

### **Step 2: Login and Obtain JWT**

Use the default credentials (or the ones you set in `.env`) to log in. We'll store the returned token in a shell variable for subsequent requests.

```bash
# Use your admin username and password
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "changeme"}')

TOKEN=$(echo $RESPONSE | jq -r .token)

echo "Token received: $TOKEN"
```

**Expected Response:**
The script will print the JWT, which is a long, encoded string.

---

### **Step 3: List Containers**

Use the `Authorization: Bearer <TOKEN>` header to authenticate.

```bash
curl -s http://localhost:3000/api/containers \
  -H "Authorization: Bearer $TOKEN" | jq
```

**Expected Response (Example):**
This will return a list of all containers on your Docker host.
```json
[
  {
    "id": "bf96a84496c9",
    "name": "docker-manager-api",
    "image": "dashboard-api:latest",
    "state": "running",
    "status": "Up 2 minutes",
    "ports": [
      {
        "IP": "0.0.0.0",
        "PrivatePort": 3000,
        "PublicPort": 3000,
        "Type": "tcp"
      }
    ]
  }
]
```

---

### **Step 4: Integration Test Script (Create, Verify, Control, Remove)**

This bash script provides a simple end-to-end test flow. It creates a temporary Nginx container, checks its status, stops it, and finally removes it.

Save this as `test_integration.sh`, make it executable (`chmod +x test_integration.sh`), and run it.

```bash
#!/bin/bash

API_URL="http://localhost:3000/api"
ADMIN_USER="admin"
ADMIN_PASS="changeme"
TEST_CONTAINER_NAME="temp-test-nginx-$(date +%s)"

echo "--- Logging in ---"
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$ADMIN_USER\", \"password\": \"$ADMIN_PASS\"}" | jq -r .token)

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
  echo "Login failed. Exiting."
  exit 1
fi
echo "Login successful."

echo -e "\n--- Creating container: $TEST_CONTAINER_NAME ---"
CREATE_RESPONSE=$(curl -s -X POST $API_URL/containers/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"image\": \"nginx:alpine\", \"name\": \"$TEST_CONTAINER_NAME\", \"ports\": [\"8088:80\"]}")

CONTAINER_ID=$(echo $CREATE_RESPONSE | jq -r .containerId)
echo "Container creation requested. Response: $CREATE_RESPONSE"

if [ -z "$CONTAINER_ID" ] || [ "$CONTAINER_ID" == "null" ]; then
    echo "Failed to create container. Exiting."
    exit 1
fi
echo "Container ID: $CONTAINER_ID"

# Give Docker a moment to create the container
sleep 5

echo -e "\n--- Verifying container is running ---"
STATUS=$(curl -s $API_URL/containers \
  -H "Authorization: Bearer $TOKEN" | jq -r ".[] | select(.id == \"$CONTAINER_ID\") | .state")

if [ "$STATUS" != "running" ]; then
  echo "Container is not running! Status: $STATUS. Exiting."
  exit 1
fi
echo "Container is running."

echo -e "\n--- Stopping container ---"
curl -s -X POST $API_URL/containers/$CONTAINER_ID/stop \
  -H "Authorization: Bearer $TOKEN" | jq

sleep 3

echo -e "\n--- Verifying container is stopped ---"
STATUS=$(curl -s $API_URL/containers \
  -H "Authorization: Bearer $TOKEN" | jq -r ".[] | select(.id == \"$CONTAINER_ID\") | .state")
if [ "$STATUS" != "exited" ]; then
    echo "Container did not stop! Status: $STATUS. Exiting."
    exit 1
fi
echo "Container stopped successfully."

echo -e "\n--- Removing container ---"
curl -s -X DELETE $API_URL/containers/$CONTAINER_ID \
  -H "Authorization: Bearer $TOKEN" | jq

echo -e "\n--- Test complete. Cleanup finished. ---"
```

---

### **Step 5: Pull an Image**

This endpoint is asynchronous. It will return `202 Accepted` immediately.

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
You can verify the image has been pulled by running `docker images` on the host machine.