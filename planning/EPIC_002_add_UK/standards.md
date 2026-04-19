# Standards for EPIC 2 - Add UK Support

## General Constraints
1. **Backward Compatibility**: The application MUST default to Australian (`AU`) behavior if the `COUNTRY` environment variable is not explicitly provided. No existing instances should break on upgrade.
2. **Environment Variables**: All new environment variables (`COUNTRY`) must be documented in `.env.example`.
3. **Database Consistency**: Only postcode boundary seed data (`pcode_bounds_*.sql`) should change based on the country. The core database schema must remain generic.
4. **API Agnosticism**: The app must query `LAMBDA_BASE_URL` without hardcoding path assumptions that prevent pointing it to a UK-equivalent spatial endpoint.

## UI/UX Constraints
1. **Terminology Abstraction**: Hardcoded terminology like "Mesh block" must be replaced with a locale dictionary that switches between "Mesh block" (AU) and "Output Area"/"Polling District" (UK).
2. **Map Centering**: The map fallback coordinate (`australia_coord`) must be parameterized based on the selected country to prevent poor UX when a user's geolocation is missing.
3. **Design System**: Follow the existing Vanilla CSS rules (`public/stylesheets/main.css`). No new frameworks (Tailwind, Bootstrap) are permitted.
