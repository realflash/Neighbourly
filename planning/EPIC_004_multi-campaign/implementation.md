# EPIC_004 - Implementation Plan

## Phase 1: Database Foundation & ETL
1. Create a Sequel migration to add the `wards`, `ward_output_areas`, `campaigns`, and `campaign_wards` tables.
2. Create a Sequel migration to add `campaign_id` to the table tracking data entry and bounds claiming (e.g., `user_claims` or equivalent).
3. Update Ruby models (if applicable) or database access helpers in `app.rb` / `view_helper.rb` to join `abs_2011_mb` to `ward_output_areas` and filter by the `ward_id`s associated with the `campaign_id` via `campaign_wards`.
4. **ETL Script**: Write an ETL Ruby/SQL script to import the mapping from Official UK data. This mapping will come from an **ONS "Output Area to Ward Lookup" CSV** (available from the ONS Open Geography Portal or the "Names and Codes" folder bundled with the ONSPD dataset). The script will populate the new `wards` and `ward_output_areas` tables.

## Phase 2: Campaign Administration (US-001)
1. Add new Sinatra routes in `app.rb` (`GET /admin/campaigns`, `POST /admin/campaigns`, etc.) wrapped in the `authorised` block.
2. Build the `campaigns.erb` view template using premium aesthetics (glassmorphism cards, modern gradients).
3. Implement the Add/Edit forms populated with a dynamic multi-select list of Wards fetched from the `wards` table, allowing administrators to pick multiple wards for a single campaign.
4. Implement the Archive button logic with micro-animations.

## Phase 3: Map Interaction & Campaign Selection (US-002)
1. Add a Campaign Dropdown overlay to the map view (`map.erb` / `map.js`).
2. Populate the dropdown dynamically by fetching active campaigns from the server.
3. Prevent map interactions (claiming/unclaiming) if no campaign is selected. Trigger a sleek modal animation if the user clicks the map prematurely.
4. Update `map.js` to pass `?campaign_id=...` to all boundary tile fetches and claim requests.
5. Update `app.rb` map endpoints (`/territories/bounds`, `/claim`, etc.) to filter strictly by `campaign_id`, ensuring boundaries from other campaigns are invisible.

## Phase 4: Integration and Data Flow
1. Verify that all Data Entry pages (`/data-entry`) require a selected campaign and correctly stamp records with `campaign_id`.
2. Connect UI elements to the backend endpoints and ensure smooth transitions.
