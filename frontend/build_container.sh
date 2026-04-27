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
    VERSION=$(cat VERSION 2>/dev/null || echo "1.0.0")
    run_stage "Building (Container)" "DOCKER_BUILDKIT=0 docker build --label version=${VERSION} -t neighbourly-app:local -t neighbourly-app:v${VERSION} ."
    BUILD_APP_RESULT=$?
    run_stage "Building (Bounds)" "docker build -t neighbourly-bounds-service:local ../bounds_service"
    BUILD_BOUNDS_RESULT=$?
    if [ $BUILD_APP_RESULT -eq 0 ] && [ $BUILD_BOUNDS_RESULT -eq 0 ]; then
        BUILD_CONT_RESULT=0
    else
        BUILD_CONT_RESULT=1
    fi
else
    STAGES+=("Building (Dependent bounds container)")
    RESULTS+=("SKIPPED")
    BUILD_CONT_RESULT=1
fi

if [ $BUILD_CONT_RESULT -eq 0 ]; then
    # Run isolated tests via Makefile
    echo -e "${YELLOW}Running Isolated Automated Tests via Makefile...${NC}"
    if make -C .. test-e2e-isolated; then
        echo -e "  ${GREEN}✓ Isolated tests passed.${NC}"
        run_stage "Testing" "true"
    else
        echo -e "  ${RED}✗ Isolated tests failed.${NC}"
        run_stage "Testing" "false"
    fi
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
