# EPIC_006 - Standards

## 1. UI Constraints
- **Design Aesthetics**: The campaign type dropdown and related guidance must be visually excellent, feeling premium and cohesive with the modern aesthetic established in earlier epics.
- **Form Layouts**: The Campaign Admin form uses modern glassmorphism or sleek card-based layouts. Additions for campaign type and guidance must seamlessly integrate into this layout without cluttering the UI.

## 2. API & Backend Constraints
- **Framework**: Use the existing Sinatra framework in Ruby.
- **Data Integrity**: Database queries and schema migrations must use Sequel ORM.
- **PDF Generation**: Must use the existing `pdfmake` library within the Node.js `bounds-service`.
- **API Boundaries**: The `bounds-service` API for PDF generation must accept a campaign type parameter (e.g. `template=canvassing` or `template=leafleting`) to dynamically render the correct structure without breaking existing backwards compatibility for non-typed map boundaries.

## 3. Database Constraints
- **Schema updates**: 
  - The `campaigns` table requires a new `campaign_type` column (default: `leafleting`).
  - The `gnaf_201702.addresses` table requires new columns for `elector_name`, `gender`, and `age` to support Canvassing PDFs.
- **ETL Constraints**: The Ruby ETL script `transform_addresses.rb` must be carefully updated to map CSV electoral data to the new database columns while maintaining memory efficiency (processing line-by-line).

## 4. Traceability
- **Testing Requirements**: E2E scenarios must be documented in `testing.md` to cover both leafleting and canvassing PDF content output generation.
