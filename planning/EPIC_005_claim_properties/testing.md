# Testing for EPIC_005

## 1. Automated Tests
- Validate migration logic: Verify that the migration succeeds on both the container environment and CI.
- Validate `app.rb` logic: Run existing RSpec tests to ensure claim routes remain secure and data boundaries are respected.
- Verify `ClaimService`: Test the updated unclaim, claim, and conflict resolution logic.

## 2. Automated End-to-End Playwright Tests
- **Claim Priority (Admin)**: Use Playwright to log in as admin, click an unclaimed area, and set priority to Low. Assert map color changes to yellow (`#ffffcc`). Set priority to High. Assert map color changes to green (`#238443`).
- **Claim Status (User)**: Use Playwright to log in as standard user. Claim a mesh block. Assert map turns purple (`#9d5fa7`). Click popup and choose "Mark Complete". Assert map turns blue (`#2171b5`).
- **Claim Releasing (Admin & User)**:
  - Write a test where user unclaims a complete mesh block. Assert map returns to the default priority color (green or yellow).
  - Write a test where admin sets a priority, then the claim is made, then unclaimed. Assert priority remains what the admin set.
- **Claim Names**:
  - Write a test where User B clicks User A's claim. Assert popup says "Claimed by: Firstname Lastname".
  - Write a test to verify if User A has no name, it gracefully degrades.

## 3. Map Legend Verification
- Ensure the map legend in the bottom right says "Complete" instead of "Organised event".
