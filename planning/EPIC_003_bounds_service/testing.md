# Testing & Traceability: Bounds Service

## Traceability Matrix
| Requirement | Acceptance Criteria | Test Scenario | Status |
| :--- | :--- | :--- | :--- |
| US-001 | The code for the lambda bounds service runs in a container | Verify `docker run` successfully starts the bounds service on port 3000 | Pending |
| US-001 | The container uses the same postgis data as the uat container | Verify that querying `/territories/bounds` returns valid JSON data sourced from `neighbourly_uk` database | Pending |
| US-001 | The container exposes the same endpoints as the current lambda service | Verify `GET /territories/bounds` and `GET /map` return `200 OK` with correctly formatted payloads | Pending |
| US-001 | Subdirectory structure, isolated build scripts, run scripts, `.env` | Verify both `frontend/run_docker.sh` and `bounds_service/run_docker.sh` successfully build/run their respective containers with independent configurations | Pending |

## End-to-End Functional Tests
- **Map Interaction E2E**: The existing `spec/acceptance/meshblocks_bounds_feature.rb` (which logs in, navigates to `/map`, and attempts to load bounds) will be used to ensure the frontend can successfully communicate with the new containerised bounds service when `LAMBDA_BASE_URL` is pointed to it.
- **PDF Generation E2E**: Execute the following curl command to verify the `/map` endpoint returns a base64 encoded PDF payload for a valid Meshblock slug (e.g. `E00156867`):
  ```bash
  curl -s "http://localhost:3000/map?slug=E00156867" | jq -e '.base64 | startswith("JVBERi0x")' > /dev/null && echo "PDF generated successfully" || echo "PDF generation failed"
  ```
