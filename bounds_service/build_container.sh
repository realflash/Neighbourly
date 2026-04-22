#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

IMAGE_NAME="neighbourly-bounds-service:local"

echo "Building Docker image: $IMAGE_NAME"
docker build --load -t $IMAGE_NAME .
echo "Build complete."
