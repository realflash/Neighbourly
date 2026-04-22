#!/usr/bin/env bash
# Standard Container Pipeline Script
# <!-- Standard Version: 0.4 -->

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Container Pipeline...${NC}"

# Results tracking
declare -a STAGES
declare -a RESULTS

run_stage() {
    local stage_name="$1"
    local command="$2"
    
    echo -e "\n${YELLOW}🛠️  Stage: ${stage_name}...${NC}"
    
    # Execute the command
    eval "$command"
    local exit_code=$?
    
    STAGES+=("$stage_name")
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ ${stage_name} passed!${NC}"
        RESULTS+=("PASS")
        return 0
    else
        echo -e "${RED}❌ ${stage_name} failed with exit code ${exit_code}${NC}"
        RESULTS+=("FAIL")
        return $exit_code
    fi
}

# 1. Linting (Skipped as per design)
echo -e "\n${YELLOW}⏭️  Skipping Linting (Not configured for codebase)${NC}"
STAGES+=("Linting")
RESULTS+=("SKIPPED")
LINT_RESULT=0

# 2. Building
if [ $LINT_RESULT -eq 0 ]; then
    run_stage "Building (Container)" "DOCKER_BUILDKIT=0 docker build -t neighbourly-app:local ."
    BUILD_CONT_RESULT=$?
else
    STAGES+=("Building (Container)")
    RESULTS+=("SKIPPED")
    BUILD_CONT_RESULT=1
fi

# 3. Testing
if [ $BUILD_CONT_RESULT -eq 0 ]; then
    # Spin up a temporary database container for testing
    echo -e "${BLUE}Spinning up temporary PostgreSQL container for testing...${NC}"
    docker rm -f neighbourly-test-db > /dev/null 2>&1 || true
    if ! docker run -d --name neighbourly-test-db -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -p 5435:5432 postgres:9.4 > /dev/null 2>&1; then
        echo -e "${RED}✗ Failed to start temporary PostgreSQL container! Port 5435 may be in use.${NC}"
        run_stage "Testing" "false"
        TEST_RESULT=1
        
        # Summary Report
        echo -e "\n${BLUE}📊 Container Pipeline Summary:${NC}"
        echo "----------------------"
        for i in "${!STAGES[@]}"; do
            STAGE="${STAGES[$i]}"
            RESULT="${RESULTS[$i]}"
            if [ "$RESULT" == "PASS" ]; then echo -e "${STAGE}: ${GREEN}${RESULT}${NC}"; elif [ "$RESULT" == "FAIL" ]; then echo -e "${STAGE}: ${RED}${RESULT}${NC}"; else echo -e "${STAGE}: ${YELLOW}${RESULT}${NC}"; fi
        done
        echo "Testing: ${RED}FAIL${NC}"
        echo "----------------------"
        echo -e "${RED}❌ Container Pipeline Failed.${NC}"
        exit 1
    fi
    
    # Wait for DB to be ready
    echo -e "${YELLOW}Waiting for DB to be ready...${NC}"
    
    # Add a timeout so we never hang infinitely
    MAX_WAIT=30
    WAIT_COUNT=0
    until docker exec neighbourly-test-db pg_isready -U postgres > /dev/null 2>&1; do
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
        if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
            echo -e "${RED}✗ Timed out waiting for PostgreSQL to be ready.${NC}"
            docker logs neighbourly-test-db
            docker stop neighbourly-test-db > /dev/null
            docker rm neighbourly-test-db > /dev/null
            exit 1
        fi
    done
    sleep 2 # Extra safety margin
    
    # Enable hstore extension
    docker exec neighbourly-test-db psql -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS hstore;" > /dev/null
    
    echo -e "${YELLOW}Running Automated Tests...${NC}"
    TEST_PASS=1
    
    # Test 1: US-002 Fail fast without DB_URL
    echo "  -> Testing fail-fast when DB_URL is missing..."
    FAIL_TEST_OUTPUT=$(docker run --rm neighbourly-app:local 2>&1 || true)
    if echo "$FAIL_TEST_OUTPUT" | grep -q "ERROR: DB_URL environment variable is missing or empty."; then
        echo -e "  ${GREEN}✓ Fail-fast test passed.${NC}"
    else
        echo -e "  ${RED}✗ Fail-fast test failed.${NC}"
        echo "$FAIL_TEST_OUTPUT"
        TEST_PASS=0
    fi
    
    # Test 2: Launch Test Server and verify HTTP 200
    if [ $TEST_PASS -eq 1 ]; then
        echo "  -> Launching test server..."
        docker rm -f neighbourly-test-server > /dev/null 2>&1 || true
        docker run -d --name neighbourly-test-server --network="host" -e DB_URL='postgres://postgres:password@localhost:5435/postgres' neighbourly-app:local > /dev/null
        
        # Wait for Puma to start
        sleep 5
        
        echo "  -> Executing HTTP test against test server..."
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4567 || echo "000")
        if [ "$HTTP_STATUS" == "200" ]; then
            echo -e "  ${GREEN}✓ Server responded with HTTP 200.${NC}"
        else
            echo -e "  ${RED}✗ Server responded with HTTP ${HTTP_STATUS}. Expected 200.${NC}"
            docker logs neighbourly-test-server
            TEST_PASS=0
        fi
        
        echo "  -> Tearing down test server..."
        docker stop neighbourly-test-server > /dev/null
        docker rm neighbourly-test-server > /dev/null
    fi
    
    if [ $TEST_PASS -eq 1 ]; then
        run_stage "Testing" "true"
    else
        run_stage "Testing" "false"
    fi
    TEST_RESULT=$?
    
    # Tear down the test database
    echo -e "${BLUE}Tearing down temporary PostgreSQL container...${NC}"
    docker stop neighbourly-test-db > /dev/null
    docker rm neighbourly-test-db > /dev/null
else
    STAGES+=("Testing")
    RESULTS+=("SKIPPED")
    TEST_RESULT=1
fi

# Summary Report
echo -e "\n${BLUE}📊 Container Pipeline Summary:${NC}"
echo "----------------------"
PIPELINE_FAILED=0
for i in "${!STAGES[@]}"; do
    STAGE="${STAGES[$i]}"
    RESULT="${RESULTS[$i]}"
    
    if [ "$RESULT" == "PASS" ]; then
        echo -e "${STAGE}: ${GREEN}${RESULT}${NC}"
    elif [ "$RESULT" == "FAIL" ]; then
        echo -e "${STAGE}: ${RED}${RESULT}${NC}"
        PIPELINE_FAILED=1
    else
        echo -e "${STAGE}: ${YELLOW}${RESULT}${NC}"
        # Treating SKIPPED as non-fatal for summary unless critical
        if [ "$STAGE" == "Linting" ]; then
            continue
        fi
        PIPELINE_FAILED=1
    fi
done
echo "----------------------"

if [ $PIPELINE_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Container Pipeline Passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Container Pipeline Failed.${NC}"
    exit 1
fi
