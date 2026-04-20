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

## 5. Configurable Spatial API Endpoint
**Standard Addressed:** General Constraint 4
**Design:**
- No code changes required, but we will document in the `README.md` that `LAMBDA_BASE_URL` must point to an API exposing `/territories/bounds` (GET) and `/map` (GET) endpoints that conform to the same GeoJSON and Base64-PDF schema as the Australian service.
