#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status.
set -e

PORT=${PORT:-3000}
SLUG="E00156867"
URL="http://localhost:${PORT}/map?slug=${SLUG}"

echo "Testing PDF Generation Endpoint: $URL"

# We use curl to fetch the payload and jq to extract the base64 string
# The base64 representation of a PDF always starts with "JVBERi0x" which corresponds to "%PDF-1"
RESPONSE=$(curl -s "$URL")

if echo "$RESPONSE" | jq -e '.base64 | startswith("JVBERi0x")' > /dev/null; then
    echo "✅ Success! Valid base64 encoded PDF returned for slug ${SLUG}."
    exit 0
else
    echo "❌ Failed! Response did not contain a valid base64 encoded PDF."
    # Output part of the response for debugging, handling potentially long/empty responses safely
    echo "Response preview: $(echo "$RESPONSE" | head -c 200)"
    exit 1
fi
