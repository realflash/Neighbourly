# Design for EPIC_005

## Database Schema Changes
To support priority and completion statuses without losing information when a claim is released, we will modify the `claims` table.

### Migration: Add Priority and Status to Claims
Create a new migration `009_add_priority_and_status_to_claims.rb`:
- Add `priority` column (`String`, default: 'high').
- Add `status` column (`String`, default: 'claimed').
- We will stop using `deleted_at` for soft deletes when a claim is "unclaimed". Instead, an unclaimed mesh block will have `status = 'released'` and `mesh_block_claimer = NULL`.
- Backfill: Set all existing non-deleted claims to `status = 'claimed'`.

## Backend API Changes (`app.rb` & `ClaimService`)

1. **Update `ClaimService#claims`**:
   - Currently filters by `deleted_at is NULL`.
   - Update it to return ALL active rows (which includes `status = 'released'` so that priority can be retrieved).

2. **Update `ClaimService#claim`**:
   - When claiming a mesh block, check if a row already exists for this `mesh_block_slug` and `campaign_id`.
   - If it exists, update it: `status = 'claimed'`, `mesh_block_claimer = user_email`.
   - If not, insert it: `status = 'claimed'`, `mesh_block_claimer = user_email`, `priority = 'high'`.

3. **Update `ClaimService#unclaim`**:
   - Instead of setting `deleted_at = Time.now`, set `status = 'released'` and `mesh_block_claimer = NULL`.
   - This ensures the `priority` is retained.

4. **New API Endpoints**:
   - `POST /claims/:slug/priority` (Admin only): Sets the priority of a claim/mesh block. If the claim doesn't exist, it creates a `status = 'released'` row with the new priority.
   - `POST /claims/:slug/status` (User & Admin): Allows a user to mark their own claim as 'complete'. Admin can mark any claim as 'complete'.
   - Update `/meshblocks_bounds`: Instead of just returning `claim_status`, it should also return `claim_priority` and `claim_owner_name`.

## Frontend Changes (`map.js` & `main.css`)

1. **Map Display (`map.js`)**:
   - Update `claim_status` mapping. Use `status = 'complete'` mapped to the `#2171b5` color (formerly quarantine).
   - If `claim_status` is `released` or doesn't exist, use the standard or overridden `claim_priority` to determine whether to render `#238443` (High) or `#ffffcc` (Low).
   - Show `claim_owner_name` on the popup if a claim is owned.

2. **Popups (`map.js`)**:
   - **Admin View**: Add a `<select>` dropdown in the popup to set priority to High or Low. Changes fire an AJAX request to `/claims/:slug/priority` and reload the map.
   - **User View (Own Claim)**: Add a 'Mark Complete' button. Fires AJAX request to `/claims/:slug/status` and updates map.
   - **Any View**: Display 'Priority: High/Low' in the popup. Display 'Claimed by: [Name]' instead of generic 'someone else'.
