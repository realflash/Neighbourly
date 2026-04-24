#!/usr/bin/env bash
# Neighbourly App Release Pipeline

set -e # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

REGISTRY="registry.digitalocean.com/attono/neighbourly-app"
PROJECT_NAME="neighbourly-app"

# Get version from VERSION file
VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")

# If version is passed as argument, use it
if [ -n "$1" ]; then
    VERSION=$1
fi

echo -e "${BLUE}📦 Initializing Release Pipeline for ${VERSION}...${NC}"

# 1. Execute the full validation pipeline
if ./build_container.sh; then
    echo -e "\n${GREEN}✅ Validation passed. Ready for registry delivery.${NC}"
else
    echo -e "\n${RED}❌ Validation failed. Release aborted.${NC}"
    exit 1
fi

# 2. Tag for DigitalOcean
echo -e "${BLUE}🏷️  Applying Registry Tags...${NC}"
docker tag ${PROJECT_NAME}:local ${REGISTRY}:v${VERSION}
docker tag ${PROJECT_NAME}:local ${REGISTRY}:latest

# 3. Push to Registry
echo -e "${BLUE}🚀 Pushing to DigitalOcean:${NC} ${REGISTRY}"
docker push ${REGISTRY}:v${VERSION}
docker push ${REGISTRY}:latest

echo -e "\n${GREEN}✨ Release ${VERSION} complete!${NC}"
echo -e "Registry image: ${REGISTRY}:v${VERSION}"
