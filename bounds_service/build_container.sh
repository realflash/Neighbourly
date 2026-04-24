#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
IMAGE_NAME="neighbourly-bounds-service:local"
IMAGE_TAG="neighbourly-bounds-service:v${VERSION}"

echo "Building Docker image: $IMAGE_NAME and $IMAGE_TAG"
docker build --load --label version=${VERSION} -t $IMAGE_NAME -t $IMAGE_TAG .
echo "Build complete."
