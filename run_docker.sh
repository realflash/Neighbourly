#!/usr/bin/env bash

# Source environment variables if .env exists
if [ -f .env ]; then
    source .env
fi

CONTAINER_NAME="neighbourly-uat"
IMAGE_NAME="neighbourly-app:local"

echo "Checking for existing container named '$CONTAINER_NAME'..."
if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" ]; then
    echo "Found existing container. Stopping and removing..."
    docker stop $CONTAINER_NAME >/dev/null 2>&1
    docker rm $CONTAINER_NAME >/dev/null 2>&1
    echo "Removed existing container."
else
    echo "No existing container found."
fi

echo "Starting new container from image '$IMAGE_NAME'..."
# Using --network="host" allows the container to seamlessly connect to PostgreSQL 
# running natively on the host machine's localhost:5432
docker run -d \
    --name $CONTAINER_NAME \
    --network="host" \
    -e DB_URL="$DB_URL" \
    $IMAGE_NAME

echo "Container is now running! You can access the app at http://localhost:4567"
