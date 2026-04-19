# Testing Plan for EPIC 2 - Add UK Support

## 1. Unit Tests
- *None specific required*, mostly configuration and UI state mapping.

## 2. E2E & Acceptance Tests (RSpec)
- **Map View Fallback**: Create an acceptance spec that verifies when `COUNTRY` is unset, the map defaults to AU coordinates. Verify that when `COUNTRY=UK`, the map defaults to UK coordinates.
- **Terminology UI Test**: Create a spec to verify that if `COUNTRY=UK`, the text "Output Area" appears in the interface instead of "Mesh block".
- **Container Build Test**: Add a test script or assert in CI that verifies `pcode_bounds_uk.sql` imports successfully without syntax errors.

## 3. Manual Verification Steps
- Start the server with `COUNTRY=AU`. Navigate to `/map` without clicking any locations. Ensure it centers on Australia and uses "Mesh block".
- Search for an Australian postcode (e.g. `2000`).
- Start the server with `COUNTRY=UK`. Navigate to `/map`. Ensure it centers on the UK and uses "Output Area".
- Search for the test UK postcode (`GU18 5SW`).
