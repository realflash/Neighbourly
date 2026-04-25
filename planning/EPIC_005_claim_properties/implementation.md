# Implementation for EPIC_005

## 1. Database Migration
- Create `frontend/migrations/009_add_priority_and_status_to_claims.rb`.
- `add_column :claims, :priority, String, default: 'high'`
- `add_column :claims, :status, String, default: 'claimed'`
- `DB[:claims].update(status: 'claimed')`
- Note: This migration effectively begins the transition away from soft deletes (`deleted_at`) for "unclaiming" and towards `status = 'released'`.

## 2. Update Backend Models & Services
- **`frontend/models/user.rb`**: Ensure we can look up `first_name` and `last_name` by email easily.
- **`frontend/services/claim_service.rb`**:
  - `claims(slugs, campaign_id)`: Return active and released claims by filtering on `deleted_at is NULL`.
  - `claim(...)`: Refactor to use `insert_conflict` or check existence first. Update `status = 'claimed'`, `mesh_block_claimer = user_email`.
  - `unclaim(...)`: Update to `status = 'released'`, `mesh_block_claimer = nil`.
- **`frontend/app.rb`**:
  - Update `claim_status(claimer)` logic to also consider `status` and return `claimed_by_you`, `claimed`, `complete`, or `released`.
  - In `get_meshblocks_with_status`, load the priority and the `first_name` + `last_name` of the claimer to inject into `json["features"]`.
  - Create new endpoints:
    - `POST /admin/claims/:id/priority` (requires admin auth).
    - `POST /claims/:id/complete` (requires claimer or admin auth).

## 3. Update Frontend Map Logic
- **`frontend/public/javascript/map.js`**:
  - Update `claimStyles` definitions.
  - Update `style` function to parse the `priority` property if `claim_status` is `released` or not provided.
  - Inject the priority dropdown and "Mark Complete" button into the Leaflet popup rendering.
  - Ensure popup text says "Claimed by: {First} {Last}" instead of "someone else".
  - Wire up AJAX calls to the new endpoints and refresh map (`updateMap(true)`).

## 4. Legend Update
- Update `legend.onAdd` in `map.js` to replace 'Organised event' with 'Complete', preserving the colour but changing the label.
