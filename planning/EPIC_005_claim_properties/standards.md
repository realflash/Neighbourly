# Standards for EPIC_005

## Design System & Styling
- **Primary Brand Color**: `#FD4A00` (Orange)
- **Error Messages**: `#B50000` (Red)
- **Grey Text**: `#555`, `#5b5c60`
- **Map Claim Styles** (from `map.js`):
  - **High Priority** (fourthQuartile default): `#238443`
  - **Low Priority** (firstQuartile default): `#ffffcc`
  - **Claimed by You**: `#9d5fa7`
  - **Claimed (by others)**: `#d5545a`
  - **Complete** (replaces Quarantine/Organised event): `#2171b5`

All new buttons or dialog dropdowns should utilize the existing CSS classes in `main.css` (like `.popupbutton` or `.form-control`).

## Database Migrations
- Use Sequel migrations in `frontend/migrations/`.
- Ensure migrations follow the sequential naming pattern (e.g., `009_...`).

## API Structure
- Sinatra backend handles API logic in `app.rb`.
- Responses should be JSON where possible.
- Use `ClaimService` for all `claims` table interactions.
