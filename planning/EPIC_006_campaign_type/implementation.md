# EPIC_006 - Implementation Plan

## Phase 1: Database & ETL Updates
1. **Migration File**: Create `frontend/migrations/009_add_campaign_type.rb` to add `campaign_type` string column (default `'leafleting'`) to the `campaigns` table.
2. **ETL Script Update**: Update `frontend/etl/transform_addresses.rb` to parse `Elector Name`, `Gender`, and `Age` from the input CSV and alter the `gnaf_201702.addresses` CREATE TABLE statement to include `elector_name`, `gender`, and `age` fields. Update the COPY statement and insertion loop to map these successfully.

## Phase 2: Backend Application Logic
1. **Ruby API Update**: Modify `frontend/app.rb` POST `/admin/campaigns` handler to accept and save `params[:type]`.
2. **Proxy Parameter**: Modify the proxy route in `app.rb` that requests bounds from the node service so it looks up the requested campaign's `campaign_type` and injects it as a URL parameter (e.g. `&type=canvassing`) when forwarding the request to the bounds service.

## Phase 3: UI Updates
1. **Campaign Creation Form**: Update `frontend/views/campaigns.haml` to add a dropdown for selecting the campaign type. Add the relevant guidance text about PDF generation next to it.
2. **Campaign Edit/Archive**: *(Assigned in user story, might require a new edit endpoint or updating the existing UI to support inline editing).*

## Phase 4: PDF Generation Engine (Node.js)
1. **Dynamic Layout Routing**: In `bounds_service/build-pdf.js` and `handler.js`, intercept the new `type` query parameter.
2. **Leafleting Generator**: Implement a new `leafletingLayout` that strips the checkboxes and constructs a compact list combining properties on the same street, appended with the static informational text (Date of decision, etc.).
3. **Canvassing Generator**: Implement a new `canvassingLayout` that utilizes the new `elector_name`, `gender`, `age` parameters returned from the raw SQL query. Render the detailed table with specific checkbox columns for each elector.

## Phase 5: Testing & Release
1. Run local ETL test to verify the new CSV parsing outputs correctly.
2. Generate both leafleting and canvassing PDFs and visually inspect against acceptance criteria.
