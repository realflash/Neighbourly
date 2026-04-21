# Design for EPIC 2 - Add UK Support

## 1. Configuration & Context (Backend)
**Standard Addressed:** General Constraints 1, 2, & 4
**Design:**
- Introduce a new environment variable `COUNTRY` to `.env` and `.env.example`.
- In `app.rb`, read `ENV['COUNTRY']` and have the app abort if missing
- Expose the `COUNTRY` variable to the frontend. Since we use Sinatra/HAML, we can inject this value via a `data-country` attribute on the `#map` container in `views/map.haml`.

## 2. Dynamic Map Fallback Location (UI)
**Standard Addressed:** UI/UX Constraint 2
**Design:**
- In `public/javascript/map.js`, retrieve the country code from `$('#map').data('country')`.
- Replace the hardcoded `australia_coord` fallback with a switch statement:
  ```javascript
  var fallback_coords = {
    'AU': [-29.8650, 131.2094],
    'UK': [54.5, -4.0],
    'GB': [54.5, -4.0]
  };
  var default_coord = fallback_coords[country] || fallback_coords['AU'];
  var default_zoom = country === 'UK' ? 6 : 5;
  ```

## 3. Localised UI Terminology (UI)
**Standard Addressed:** UI/UX Constraint 1
**Design:**
- In `app.rb` (or a helper), define a locale dictionary:
  ```ruby
  LOCALES = {
    'AU' => { region_name: 'Mesh block' },
    'UK' => { region_name: 'Output Area' }
  }
  ```
- Expose the correct `region_name` to the frontend via a data attribute (e.g., `data-region-name`).
- Update `map.js` popups and alerts to use `region_name` instead of hardcoded strings like "This area cannot be downloaded...".
- Update HTML views (`views/map.haml`, `views/map_header.haml`) to use the localized term dynamically.

## 4. Dynamic Postcode Boundary Seeding (Database)
**Standard Addressed:** General Constraint 3
**Design:**
- Rename `pcode_table.sql` to `pcode_bounds_au.sql`.
- Create a minimal placeholder `pcode_bounds_uk.sql` containing a sample UK postcode (e.g., `GU18 5SW`) so the database structure remains valid.
- Update `build_container.sh` or the `README.md` instructions to explicitly state:
  `psql neighbourly < pcode_bounds_au.sql` (for Australia)
  `psql neighbourly < pcode_bounds_uk.sql` (for UK)
- Ensure the table schema `pcode_bounds` remains identical in both files.

## 5. Local Spatial API Pod (Replacement for AWS Lambda)
**Standard Addressed:** General Constraint 4
**Design:**
- **Architecture:** Deploy the Node.js logic from `neighbourly-serverless` as an internal microservice running in its own independent Pod within the K8s cluster namespace, completely removing the AWS Lambda dependency.
- `LAMBDA_BASE_URL` in the Ruby app will simply point to the internal Kubernetes Service (e.g., `http://spatial-api-service:3000`).
- **GIS Database Requirements:** The Spatial API pod will connect to a dedicated PostGIS-enabled PostgreSQL database (separate from the main app's database).
- **UK Data Sourcing & Preparation:**
  - **Boundaries (`admin_bdys` equivalent):** We will use the **ONS Output Area Boundaries** (available as open-source Shapefiles or GeoJSON via the ONS Open Geography Portal). These will be imported into a PostGIS table using standard GIS tools like `shp2pgsql` or `ogr2ogr`.
  - **Addresses (`gnaf_addresses` equivalent):** Since this is an election app, campaigns will use their legally obtained **Electoral Register**. This data will be matched with the open-source **OS Open UPRN** or **ONS UPRN Directory (OUPRD)** to geocode each address and assign it to the correct Output Area.
- **ETL Scripts (To be created in this Epic):**
  - We will create an `etl/` directory containing the scripts needed to load UK data into the Australian schema expected by the Node API.
  - `etl/load_boundaries.sh`: A shell script utilizing `ogr2ogr` to import the ONS Output Area shapefile into PostGIS, and a SQL transformation to map the UK fields (e.g., `OA21CD`) to the expected columns (`mb_11code`, `geom`, `mb_category = 'RESIDENTIAL'`). Note: We will also update the Node.js API to query SRID `4326` (standard WGS84) instead of the Australian `4283`.
  - `etl/transform_addresses.rb`: A Ruby/Python script that takes a standard UK Electoral Register CSV and maps it to the `gnaf_201702.addresses` table format (e.g., mapping UPRN to `gnaf_pid`, Output Area to `mb_2011_code`, and parsing building names/numbers into `number_first` and `street_name`). It will hardcode `alias_principal = 'P'` to satisfy the existing API queries.
