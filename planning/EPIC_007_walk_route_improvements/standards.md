# EPIC 007 Standards & Constraints

These standards are derived from the local configuration files and the existing implementation of the bounds service. They act as inviolable constraints for the Walk Route Improvements epic.

## 1. Code Style Constraints
- **Indentation**: 2 spaces (derived from root `.eslintrc.js`).
- **Quotes**: Single quotes for strings (`quotes: ['error', 'single']`).
- **Semicolons**: The bounds service currently uses semicolons heavily, despite the root ESLint config specifying `never`. For `bounds_service` modifications, match the existing file style (use semicolons where already present).

## 2. PDF Generation & Styling Constraints
- **Library**: `pdfmake` is the core library used for PDF generation in the `bounds_service`. All layout and styling changes must be compatible with `pdfmake`'s document definition format.
- **Fonts**: The `RobotoCondensed` font family (Regular, Bold, Italic) is the established font descriptor and must be used for all text rendered in the PDF.
- **Pagination**: The `dontBreakRows: true` directive must be strictly maintained to ensure table rows (and grouped houses) do not break awkwardly across pages.
- **Table Structure**: `pdfmake` table definitions require columns to match the defined `widths` array. If multiple columns are used, empty placeholder cells `{}` must be provided to balance rows.

## 3. Data Processing Constraints
- **Environment Variable**: `SPLIT_ODD_EVEN` must be retrieved using `process.env.SPLIT_ODD_EVEN`.
- **Stateless Sorting**: Address coalescence, numerical sorting, and odd/even splitting must be performed in-memory during the PDF generation pipeline (`build-pdf.js`). No structural changes to the database schema or persistent data are permitted for these features.
