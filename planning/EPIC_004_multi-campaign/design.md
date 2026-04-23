# EPIC_004 - Verified Design

## 1. Database Schema Additions
*(Adhering to Database Constraints: Sequel Migrations & Relations)*
- **Table: `campaigns`**
  - `id`: Primary Key
  - `name`: String (Text), required
  - `status`: String (Enum: `active`, `archived`), defaults to `active`
  - `created_at`: Timestamp
- **Table: `wards` (New Reference Table)**
  - `id`: Primary Key
  - `name`: String (Text), required (e.g., 'Warringah', 'Lightwater')
- **Table: `campaign_wards` (Mapping Table)**
  - `campaign_id`: Foreign Key to `campaigns`
  - `ward_id`: Foreign Key to `wards`
- **Table: `ward_output_areas` (Mapping Table)**
  - `ward_id`: Foreign Key to `wards`
  - `oa_code`: String (maps to the `mb_2011_code` in `addresses` and `abs_2011_mb` tables)
- **Table modifications**
  - `meshblocks` (or `abs_2011_mb` / `user_claims`): Must support associating a user's data entry to the currently active campaign context. The table tracking claimed/visited areas must add `campaign_id`. When filtering boundaries on the map, we will filter `abs_2011_mb` by joining `ward_output_areas` where `ward_id` is IN the list of `ward_ids` associated with the selected `campaign_id` via `campaign_wards`.

## 2. Admin UI (Campaign Administration)
*(Adhering to UI Constraints: Premium Aesthetics, Forms)*
- **Campaign List View**: A premium grid or glassmorphism list displaying all active and archived campaigns.
- **Add/Edit Campaign Form**: A sleek modal or full-page form with smooth gradients and micro-animations. Contains:
  - Text input for "Name"
  - Multi-select dropdown for "Areas" (populated dynamically from the `wards` table, allowing one or more selections)
  - Submit button with hover animations.
- **Archiving**: An "Archive" button on the list view that gracefully fades out the campaign (micro-animation).

## 3. Map View UI (Selectable Areas)
*(Adhering to UI Constraints & API Constraints)*
- **Campaign Dropdown**: A modern, styled dropdown overlaying the map page. 
  - Defaults to empty if no campaign is selected.
  - If empty and map clicked: A beautiful animated modal prompts "Please select a campaign".
- **Map Interaction**: 
  - Map boundaries and data endpoints are filtered using `?campaign_id=...` parameter.
  - The map layer strictly renders ONLY the claimable/claimed areas for that campaign ID.

## 4. API & Data Flow
*(Adhering to Backend Constraints)*
- **GET /admin/campaigns**: Renders admin campaign view.
- **POST /admin/campaigns**: Creates a new campaign.
- **PUT /admin/campaigns/:id**: Updates existing campaign.
- **POST /admin/campaigns/:id/archive**: Soft deletes / changes status.
- **GET /api/campaigns**: Fetches active campaigns for the map dropdown.
- **GET /pcode_get_bounds**: Modified to accept `campaign_id`.
- **POST /claim**: Modified to accept and require `campaign_id`.
