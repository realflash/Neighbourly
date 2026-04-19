# Traceability & Testing

This document outlines how each acceptance criteria from US-001 is mapped to a test to ensure 100% E2E coverage.

## Traceability Matrix

| Acceptance Criteria | Test Scenario / Validation Method |
| :--- | :--- |
| The app can be run locally in a container | **Test 1**: Execute `docker run` command with the built image. Container must start without immediate crashing. |
| The app can be accessed at `http://localhost:4567` | **Test 2**: While container is running, execute `curl -I http://localhost:4567`. Must return HTTP 200/302. |
| The app can be stopped by running standard docker commands | **Test 3**: Execute `docker stop <container_id>`. The process must gracefully exit and the container must stop. |
| The app is entirely contained in one container | **Test 4**: Inspect the Dockerfile. It must not rely on external mounted volumes for code execution (except for optional `.env` file or local testing overrides). |
| The app can connect to local postgres on `localhost:5432` | **Test 5**: With the postgres container running natively/locally, run the application container with host networking. Accessing a database-dependent page (or running `rake db:migrate` inside the container) must succeed. |
| Base container image chosen to maximise compatibility | **Test 6**: Inspect `Dockerfile` `FROM` directive. Must be `ruby:2.3.3-slim` or similar. |
| `build_container.sh.example` used as a reference | **Test 7**: Run `./build_container.sh`. The output must display the formatted stage execution (Pass/Fail/Skipped) and Summary Report as defined in the example script. |
| The app will fail fast if it does not have a valid DB_URL | **Test 8**: Run `docker run neighbourly-app:local` without setting `DB_URL`. The container must immediately exit with a failure message. |

## Manual Test Execution Plan

1. **Build the container:** Execute `./build_container.sh` to verify Test 7.
2. **Missing DB_URL Test:** Execute `docker run --rm neighbourly-app:local` (Validates Test 8).
3. **Start the container:** Execute `./run_docker.sh`. (Validates Test 1 and 5, uses `.env` for `DB_URL`).
4. **HTTP Check:** `curl http://localhost:4567` (Validates Test 2).
5. **Stop the container:** Execute `docker stop neighbourly-uat` (Validates Test 3).
6. **Code Review:** Review `Dockerfile` (Validates Test 4 and 6).
