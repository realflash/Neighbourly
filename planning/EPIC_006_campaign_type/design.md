# EPIC_006 - Design

## 1. Database Adjustments (Data Integrity Standard)

### Campaigns Table
- Create a new migration file `009_add_campaign_type.rb`.
- Add a string column `campaign_type` to `campaigns` table, with a default value of `'leafleting'`.

### Addresses Table
- We must modify the schema of `gnaf_201702.addresses` to include:
  - `elector_name` (varchar)
  - `gender` (varchar)
  - `age` (varchar)
- The schema creation inside `frontend/etl/transform_addresses.rb` needs to be updated to inject these fields.
- The CSV ingestion mapping (`frontend/etl/transform_addresses.rb`) will be updated to read `Elector Name`, `Gender`, and `Age` (or their relevant column names) from the electoral CSV.

## 2. API & Application Logic (Backend Framework Standard)

### Sinatra API `app.rb`
- Update the `/admin/campaigns` `POST` handler to extract and save the `campaign_type` parameter.
- Update `/api/campaigns` to expose the `campaign_type`.
- The PDF download logic inside `map.js` will send `template=${campaign_type}` based on the selected campaign's properties.
- To achieve this, the `api/campaigns` endpoint must return the campaign type so the frontend can append it correctly to the PDF request URL, or the `/map` ruby route should look up the campaign type internally and pass it to `bounds-service`.
*(Design choice: We will look it up internally in the ruby backend before proxying the call to the bounds-service for security and consistency.)*

## 3. UI/UX (Aesthetics Standard)

### Campaign Form `campaigns.haml`
- Add a `<select>` dropdown for Campaign Type containing "Leafleting" and "Canvassing".
- Add elegant, modern guidance text next to the dropdown explaining the impact on PDFs, formatted consistently with existing form fields.

### Map Header `map_header.haml`
- The Template selection dropdown (`#template`) already exists (e.g. "Hidden" vs "Visible" map boundaries). We will ensure the `campaign_type` dictates the structural layout of the PDF dynamically while leaving the visual boundaries option up to the user.

## 4. PDF Layouts (Node PDFMake Standard)

### Bounds Service `build-pdf.js`
- The `generateMap` function will receive `campaign_type` via query string (e.g., `&type=leafleting`).
- **Leafleting Layout**:
  - The map image.
  - A simple list of addresses (one per line, combining multiple house numbers on the same street e.g., "1-4 Main Street").
  - A static informational section (Date of decision, Consultation dates, Proposal details, Decision details, Next steps, Contact details).
- **Canvassing Layout**:
  - The map image.
  - A robust table, keeping the existing street order, but showing one row per *elector*.
  - The columns: "UPRN & Building", "Postcode", "Elector name", "Unsuccessful (box)", "Refused (box)", "Postal vote", "Response code (box)".
