# EPIC 007 Implementation Plan

## Phase 1: Data Pipeline Refactoring (`bounds_service/build-pdf.js`)
1. **Extract and Modularize Pre-processing**: Create helper functions at the top of `build-pdf.js` to handle data transformation before it touches `pdfmake` logic.
2. **Implement Number Priority & Sorting**:
   - Write a function that splits a street's addresses into `named` (no number) and `numbered` (has a valid `street_number`).
   - Implement a numeric sorting algorithm for `numbered` items.
   - Implement an alphabetical sorting algorithm for `named` items.
3. **Implement Odd/Even Split & Coalescence**:
   - Read `process.env.SPLIT_ODD_EVEN`.
   - Write the coalescence algorithm. If odd/even split is disabled, adjacent houses are `n, n+1`. If split is enabled, separate the list into `odds` and `evens` first, and treat `n, n+2` as consecutive within those sub-lists.
   - Return formatted string arrays for the PDF engine.

## Phase 2: PDF Headers
1. **Extract Meta Information**:
   - Pass `assignee_name`, `campaign_name`, and `slug` to the `create` function from `handler.js`.
   - Compute the distinct street summary string: "Covering Street A, Street B, and Street C."
2. **Inject Header Content**:
   - Prepend `pdfmake` content nodes to `docDefinition.content` before the tables to render these details cleanly on the first page.

## Phase 3: Leafleting Template Layout
1. **Isolate Streets**: Instead of building one massive `table`, iterate over the grouped streets and push individual `table` objects to `docDefinition.content`.
2. **Implement 2-Column Balance**:
   - Map the coalesced numbered strings to the left column.
   - Map the named houses to the right column.
   - Use `Math.max(numbered.length, named.length)` to generate rows. Pad empty spaces with `{ text: '' }` to satisfy `pdfmake` constraints.
   - Apply `headerRows: 1` and `dontBreakRows: true` to each table to ensure the street name repeats across page breaks.

## Phase 4: Canvassing Template Layout
1. **Isolate Streets**: Same as Phase 3, but using the 7-column canvassing layout.
2. **Same-Property Deduplication**:
   - Iterate through electors on a street.
   - Keep a reference to `last_gnaf_pid`. If the current elector matches `last_gnaf_pid`, blank out the `Property` and `Postcode` cells and write `(same property)`.
   - Apply table-level pagination protection (`dontBreakRows`).
