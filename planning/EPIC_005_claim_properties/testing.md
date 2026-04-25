# Testing for EPIC_005

## 1. Automated Tests
- Validate migration logic: Verify that the migration succeeds on both the container environment and CI.
- Validate `app.rb` logic: Run existing RSpec tests to ensure claim routes remain secure and data boundaries are respected.
- Verify `ClaimService`: Test the updated unclaim, claim, and conflict resolution logic.

## 2. Manual End-to-End User Journeys
- **Claim Priority (Admin)**: Log in as admin, click an unclaimed area, set priority to Low. Verify map color changes to yellow (`#ffffcc`). Set priority to High. Verify map color changes to green (`#238443`).
- **Claim Status (User)**: Log in as standard user. Claim a mesh block. Map turns purple (`#9d5fa7`). Click popup and choose "Mark Complete". Map turns blue (`#2171b5`).
- **Claim Releasing (Admin & User)**:
  - User unclaims a complete mesh block. Map should return to the default priority color (green or yellow).
  - Admin sets a priority, then the claim is made, then unclaimed. Priority should remain what the admin set.
- **Claim Names**:
  - As User B, click User A's claim. Verify popup says "Claimed by: Firstname Lastname" instead of the generic text or email address.
  - Verify if User A has no name, it gracefully degrades.

## 3. Map Legend Verification
- Ensure the map legend in the bottom right says "Complete" instead of "Organised event".
