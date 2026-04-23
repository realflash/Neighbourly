# EPIC_004 - Traceability & Testing

## Traceability to User Stories
- **US-001** is covered by Phase 2 (Campaign Administration). The E2E tests must verify creating, editing, and archiving campaigns.
- **US-002** is covered by Phase 3 & 4 (Map Interaction & Data Flow). The E2E tests must verify dropdown population, map filtering, claim blocking when no campaign is selected, and successful claim attribution to a selected campaign.

## Playwright E2E Testing Plan

### 1. Admin Campaign Management
- **Test:** Administrator can create a new campaign.
  - Setup: Login as Admin.
  - Action: Navigate to Admin > Campaigns. Click "New Campaign", enter "Leaflet Drop 2026", select Ward "Warringah", click Save.
  - Assertion: "Leaflet Drop 2026" appears in the active campaigns list.
- **Test:** Administrator can edit an existing campaign.
- **Test:** Administrator can archive an existing campaign.
  - Assertion: Archived campaign no longer appears in the Map View dropdown.

### 2. Map View Interaction
- **Test:** Dropdown populates correctly.
  - Assertion: Dropdown contains "Leaflet Drop 2026" and no archived campaigns.
- **Test:** Cannot claim without selecting a campaign.
  - Action: Click a valid meshblock on the map without selecting a campaign.
  - Assertion: A beautiful modal appears prompting "Please select a campaign". The meshblock does not become claimed.
- **Test:** Successfully claiming with a selected campaign.
  - Action: Select "Leaflet Drop 2026". Click a valid meshblock.
  - Assertion: The meshblock turns claimed. A database check (or mock verification) confirms the claim has `campaign_id` set to the ID of "Leaflet Drop 2026".
- **Test:** Map bounds filtering.
  - Action: Select "Leaflet Drop 2026". 
  - Assertion: The map bounds API request includes `?campaign_id=...` and strictly returns meshblocks associated with that campaign's assigned ward.

*100% functional E2E test coverage for all acceptance criteria must be provided.*
