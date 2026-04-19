#!/usr/bin/env bash

# Test to ensure .env.example points to port 5433 for UAT DB
if grep -q "localhost:5433" .env.example; then
    echo "TEST PASSED: .env.example correctly points to 5433."
    exit 0
else
    echo "TEST FAILED: .env.example does not point to 5433! SCRAM error will occur if user copies this."
    exit 1
fi
