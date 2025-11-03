#!/bin/bash

API_URL="http://localhost:3000/api"
ADMIN_USER="admin"
ADMIN_PASS="changeme"
TEST_CONTAINER_NAME="temp-test-nginx-$(date +%s)"

# Wait for the backend to be ready
echo "--- Waiting for backend to start... ---"
sleep 15

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