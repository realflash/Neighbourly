# EPIC 2 - Add UK Support & Internationalisation

## US_001: Configure Target Country via Environment Variable
As a developer, I want to be able to set a `COUNTRY` environment variable (defaulting to `AU`), so that the app's location-specific features can be toggled without breaking existing Australian deployments.
- [ ] Add `COUNTRY` variable to `.env.example` with default `AU`.
- [ ] The app reads the `COUNTRY` variable at startup.

## US_002: Dynamic Map Fallback Location
As a user, I want the map to default to my country's location if my browser doesn't have a cached location or if I haven't searched for a postcode, so that I don't have to pan across the globe from Australia.
- [ ] Update `map.js` to read the configured country (e.g. via a data attribute rendered in the HTML `app.rb`).
- [ ] Center map on `[-29.8650, 131.2094]` if `AU`.
- [ ] Center map on `[54.5, -4]` (approximate UK center) if `UK` or `GB`.

## US_003: Dynamic Postcode Boundary Seeding
As a developer setting up a UK instance, I want to be able to seed the database with UK postcode bounding boxes, so that UK users can search for their local areas.
- [ ] Provide a mechanism (e.g. a rake task, seed scripts, or separate SQL files) to load country-specific postcode bounds into the `pcode_bounds` table based on the `COUNTRY` setting.
- [ ] Rename the existing `pcode_table.sql` to `pcode_bounds_au.sql` and update README.md accordingly.
- [ ] Create `pcode_bounds_uk.sql` to load UK postcode bounding boxes and update README.md accordingly.

## US_004: Local Spatial API & ETL Tooling
As a system administrator, I want to run the spatial API as a local Kubernetes microservice rather than an AWS Lambda, and I need tools to load my raw UK data into it, so that the app works in the UK without relying on external cloud providers.
- [ ] Document the setup of the internal Node.js Spatial API pod and the necessary `LAMBDA_BASE_URL` routing.
- [ ] Create `etl/load_boundaries.sh` to import ONS Output Area shapefiles into PostGIS.
- [ ] Create `etl/transform_addresses.rb` to ingest a Sanitised Electoral CSV and the OUPRD, outputting SQL `COPY` statements for the addresses table.
- [ ] Update the Node.js API to use WGS84 (SRID 4326) coordinate systems for UK compatibility.

## US_005: Localised UI Terminology
As a UK canvasser, I want the app to use familiar terminology (e.g., "Output Area" or "Polling District" instead of "Mesh block"), so that the interface makes sense in a UK context.
- [ ] Extract hardcoded terms like "Mesh block" and "SA1" into a simple locale or configuration dictionary based on the `COUNTRY` variable.
