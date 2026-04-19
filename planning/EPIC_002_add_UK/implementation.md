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
6. **Documentation Updates (`README.md`)**
   - Add instructions for loading the correct postcode SQL file.
   - Document the API contract expected by `LAMBDA_BASE_URL` (i.e. `/territories/bounds` and `/map`).

## Verification
- Test map behavior manually for both `COUNTRY=AU` and `COUNTRY=UK` environments.
- Verify terminology switches correctly on screen.
- Verify SQL import works inside Docker container for both options.
