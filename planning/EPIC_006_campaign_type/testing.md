# EPIC_006 - Testing & Traceability

## E2E Scenarios

### 1. Database Migration
- [ ] Run `rake db:version` and check if migration succeeds.
- [ ] Check DB schema to ensure `campaign_type` exists on the `campaigns` table.
- [ ] Run `./transform_addresses.rb` with a test CSV and ensure `addresses` table has `elector_name`, `gender`, `age` and is populated correctly.

### 2. Campaign Creation UI
- [ ] Log in as Admin.
- [ ] Create a Campaign. Ensure the Type dropdown is visible with "Leafleting" and "Canvassing".
- [ ] Ensure the guidance text matches the requirements.
- [ ] Save the campaign and confirm `campaign_type` is correctly saved in the DB.

### 3. Campaign Edit UI
- [ ] Log in as Admin.
- [ ] Edit a Campaign. Ensure the Type dropdown is visible.
- [ ] Change the type and save. Ensure the change persists in the DB.

### 4. Leafleting PDF Generation
- [ ] Create a 'Leafleting' campaign.
- [ ] Navigate to Map, select the campaign, select a mesh block to view the boundary.
- [ ] Download the PDF map.
- [ ] Verify the PDF contains: The map, a grouped list of properties by street with hyphenated house numbers (e.g. 1-4 Main St).
- [ ] Verify the PDF contains the static informational sections (Date of decision, etc).
- [ ] Verify the PDF does **not** contain response checkboxes.

### 5. Canvassing PDF Generation
- [ ] Create a 'Canvassing' campaign.
- [ ] Navigate to Map, select the campaign, select a mesh block to view the boundary.
- [ ] Download the PDF map.
- [ ] Verify the PDF contains: The map, a detailed table with one row per elector.
- [ ] Verify the columns match exactly: "UPRN & Building", "Postcode", "Elector name", "Unsuccessful", "Refused", "Postal vote", "Response code".
- [ ] Verify that the Unsuccessful, Refused, and Response Code columns are rendered as completely empty cells (no checkboxes or text).
