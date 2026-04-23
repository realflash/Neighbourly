# EPIC_004 - Verified Design

## 1. Database Schema Additions
*(Adhering to Database Constraints: Sequel Migrations & Relations)*
- **Table: `campaigns`**
  - `id`: Primary Key
  - `name`: String (Text), required
  - `area_name`: String (Text), required (matches the Ward or boundary name)
  - `status`: String (Enum: `active`, `archived`), defaults to `active`
  - `created_at`: Timestamp
- **Table modifications**
  - `meshblocks` (or equivalent territory table): Must support filtering. However, territories might already have an area label (e.g., Ward). A campaign maps to a specific `area_name`.
  - `users` / `user_claims`: Must support associating a user's data entry to the currently active campaign context so that multiple campaigns operating in the same area do not collide. Wait, user stories say "The data entered is then associated with the selected campaign." So the table tracking claimed/visited areas must add `campaign_id`.

## 2. Admin UI (Campaign Administration)
*(Adhering to UI Constraints: Premium Aesthetics, Forms)*
- **Campaign List View**: A premium grid or glassmorphism list displaying all active and archived campaigns.
- **Add/Edit Campaign Form**: A sleek modal or full-page form with smooth gradients and micro-animations. Contains:
  - Text input for "Name"
  - Select dropdown for "Area" (populated from known UK wards)
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
