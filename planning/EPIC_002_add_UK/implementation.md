# Implementation Plan for EPIC 2 - Add UK Support

## Phase 1: Environment & UI Configuration (Stories 1, 2, 5)
1. **Update `.env.example`**
   - Add `COUNTRY=AU` as default.
2. **Update `app.rb` and Application Configuration**
   - Read `ENV['COUNTRY']` at startup.
   - Define a locale dictionary mapping `AU` to "Mesh block" and `UK`/`GB` to "Output Area".
   - Inject `COUNTRY` and the localized terminology into the layout (e.g. `views/map.haml`) via `data-*` attributes on the `#map` div.
3. **Update Frontend JavaScript (`map.js`)**
   - Modify the default map fallback coordinates based on `data-country`.
   - Update all hardcoded "Mesh block" terminology in JS alerts/popups to use `data-region-name`.

## Phase 2: Database & Boundaries (Stories 3 & 4)
4. **Refactor Boundary SQL Files**
   - Rename `pcode_table.sql` to `pcode_bounds_au.sql`.
   - Create a barebones `pcode_bounds_uk.sql` containing the `CREATE TABLE` statement and a single test `COPY` command for `GU18 5SW`.
5. **Update Container Build Scripts**
   - Modify `build_container.sh` to load `pcode_bounds_au.sql` or `pcode_bounds_uk.sql` based on the configured `COUNTRY` variable (defaulting to AU).
6. **Local Spatial API Deployment**
   - Package the `neighbourly-serverless` codebase into a Docker container.
   - Configure a new Kubernetes Deployment and Service (`spatial-api-service`) to run alongside the Ruby app.
   - Set `LAMBDA_BASE_URL` in the Ruby app's K8s config to point to this internal service.
7. **GIS Database ETL Scripts**
   - Create `etl/load_boundaries.sh` to import ONS shapefiles via `ogr2ogr` and transform them into the `admin_bdys_201702.abs_2011_mb` table format.
   - Create `etl/transform_addresses.rb` to parse a UK Electoral Register CSV and generate SQL `COPY` statements for the `gnaf_201702.addresses` table.
   - Update `neighbourly-serverless/handler.js` to use standard WGS84 coordinates (SRID `4326`) instead of the Australian standard (`4283`).
8. **Documentation Updates (`README.md`)**
   - Add instructions for loading the correct postcode SQL file into the Ruby app DB.
   - Add instructions on how to run the ETL scripts to populate the local Spatial API pod's PostGIS database.

## Verification
- Test map behavior manually for both `COUNTRY=AU` and `COUNTRY=UK` environments.
- Verify terminology switches correctly on screen.
- Verify SQL import works inside Docker container for both options.
