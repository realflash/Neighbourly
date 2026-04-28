# EPIC 007 Traceability & Testing

To ensure 100% functional requirement coverage, the following automated E2E tests must be implemented (or existing tests updated) within `frontend/tests/bounds_service.spec.js` or a dedicated suite.

## TC-001: Address Pre-processing & Coalescence (US-001, US-002, US-003)
- **Setup:** Seed the test database with a single street containing:
  - Scattered numbers (`1, 10, 2, 3, 5`)
  - A numbered house with a name (`"Squirrels Leap, 13"`)
  - Named houses without numbers.
- **Action:** Request the Leafleting PDF.
- **Assertion:** Verify the output text sequence proves numerical sorting (e.g., `1, 2, 3, 5, 10`). Verify that `1, 2, 3` coalesced to `1-3` (assuming split off). Verify `13` has its name stripped and appears in the number list. Verify named houses appear strictly on the right side.

## TC-002: Odd/Even Splitting (US-004)
- **Setup:** Set `SPLIT_ODD_EVEN=true`. Seed a street with numbers `1, 2, 3, 4, 5, 6`.
- **Action:** Request the Leafleting PDF.
- **Assertion:** Verify output groups odd numbers as `1-5 (odd)` and even numbers as `2-6 (even)` on separate lines.

## TC-003: Leafleting Layout Integrity (US-005)
- **Setup:** Seed multiple streets with varying counts of named vs. numbered properties.
- **Action:** Request the Leafleting PDF.
- **Assertion:** Ensure the document contains multiple distinct tables (one per street). Ensure row balancing is correct and no data bleeding occurs between left and right columns across different streets. Ensure the header "Covering X, Y, and Z" exists.

## TC-004: Canvassing Deduplication (US-005)
- **Setup:** Seed a property (`gnaf_pid: 'XYZ123'`) with 3 distinct electors.
- **Action:** Request the Canvassing PDF.
- **Assertion:** Verify the output table lists the property address and postcode for the first elector only, and explicitly outputs `(same property)` in the property column for the subsequent 2 electors.
