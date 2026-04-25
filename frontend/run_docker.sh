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

ENV_ARGS=()
if [ -f .env ]; then
    while IFS='=' read -r key value; do
        if [[ $key && $key != \#* ]]; then
            value="${value%\"}"
            value="${value#\"}"
            value="${value%\'}"
            value="${value#\'}"
            ENV_ARGS+=("-e" "$key")
            export "$key=$value"
        fi
    done < <(grep -v '^#' .env | grep '=')
fi

# Using --network="host" allows the container to seamlessly connect to PostgreSQL 
# running natively on the host machine's localhost:5432
docker run -d \
    --name $CONTAINER_NAME \
    --network="host" \
    "${ENV_ARGS[@]}" \
    $IMAGE_NAME

echo "Container is now running! You can access the app at http://localhost:4567"

echo "Running database migrations..."
docker exec $CONTAINER_NAME ruby -e "require 'sequel'; Sequel.extension :migration; db = Sequel.connect(ENV['DB_URL']); Sequel::Migrator.run(db, 'migrations')"
echo "Database migrations completed."
