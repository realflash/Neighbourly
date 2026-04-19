#!/usr/bin/env bash

# Spin up a blocker container to bind port 5433
echo "Starting port-blocker container..."
docker run -d --name port-blocker -p 5433:5432 postgres:9.4 > /dev/null 2>&1 || true

echo "Running build_container.sh with a timeout of 15 seconds..."
timeout 15 ./build_container.sh > test_output.log 2>&1
EXIT_CODE=$?

# Tear down the blocker
docker rm -f port-blocker > /dev/null 2>&1

# If exit code is 124, it means timeout killed the script (it hung)
if [ $EXIT_CODE -eq 124 ]; then
    echo "TEST FAILED: build_container.sh hung infinitely!"
    exit 1
else
    echo "TEST PASSED: build_container.sh failed fast with exit code $EXIT_CODE and did not hang."
    exit 0
fi
