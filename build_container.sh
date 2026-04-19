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
    # Run tests inside the container. Assuming DB is either not needed for some specs or is provided.
    # We will just run a basic rspec. If it fails due to DB, we can handle that later.
    # Note: `rspec` might fail without DB, but let's try.
    run_stage "Testing" "docker run --rm neighbourly-app:local bundle exec rspec"
    TEST_RESULT=$?
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
