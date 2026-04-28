# EPIC 007 Design: Walk Route Improvements

## 1. Data Pre-processing Pipeline (Backend / `bounds_service/build-pdf.js`)

Before feeding data into `pdfmake`, the raw address array will be passed through a strict sequence of transformations.

### 1.1 Address Parsing and Sorting
- **Street Grouping:** Properties will be grouped by their `street` attribute.
- **House Name Stripping (US-002):** For each address, if `street_number` exists and is valid, the house name will be ignored for the purpose of the walk list. 
- **Separation:** Within each street, properties will be divided into `numbered` and `named` collections.
- **Sorting (US-001):** `numbered` properties will be sorted purely numerically (e.g., `1, 2, 10`). `named` properties will be sorted alphabetically.

### 1.2 Odd/Even Splitting (US-004)
- If `process.env.SPLIT_ODD_EVEN === 'true'`, the `numbered` properties for each street will be split into two further arrays: `odd` and `even`.
- A suffix ` (odd)` or ` (even)` will be appended to the coalesced range strings.
- If there are no odd or even numbers on the street, a placeholder row `"No buildings (odd)"` or `"No buildings (even)"` will be generated.

### 1.3 Number Coalescence (US-003)
- An algorithm will iterate through the sorted `numbered` arrays (or split odd/even arrays) to detect contiguous numeric ranges.
- A contiguous range (e.g., `12, 13, 14` or `1, 3, 5` if odds are split) will be compressed into a string representation: `12-14`.
- Gaps will break the range (e.g., `12, 14, 16` becomes `12, 14, 16` if not split by odd/even, but `12-16` if split by odd/even and they are consecutive in that subset. *Wait, US-003 says "If there are gaps in the sequence (e.g., 12, 14, 16), only the consecutive numbers should be coalesced (e.g. 12, 14, 16)". Thus, an odd sequence 1,3,5 is not consecutive numbers. Consecutive means `n, n+1`. Odd consecutive means `n, n+2` only if we consider odds. However, the requirement specifically says 12, 14, 16 are gaps and should not be coalesced unless we consider odd/even. The design will strictly check `n+1` for raw coalescence, and if `SPLIT_ODD_EVEN` is true, it will check `n+2`.*

## 2. Document Layout (PDF Generation)

### 2.1 Common Header (US-005)
- Both Leafleting and Canvassing PDFs will feature a dynamically generated header on the first page.
- It will include: Campaign Name, Assignee Name, Area Code (slug).
- **Street Summary:** A comma-separated sentence of all distinct streets in the walk list (e.g., "Covering Acacia Street, Birch Avenue, and Chestnut Drive."). This adheres to the standard `pdfmake` header text structure.

### 2.2 Leafleting Layout (US-005)
- Instead of one massive table, each street will be its own `pdfmake` `table` object.
- **Structure:** 2 columns `['50%', '50%']`.
- **Rows:** The left column iterates through the coalesced `numbered` groups. The right column iterates through the `named` houses.
- **Row Balancing:** Because the two lists may have different lengths, the layout engine will calculate the `Math.max(numbered.length, named.length)` and iterate to that length, filling missing cells with empty objects `{}` to satisfy `pdfmake`'s strict table requirements (Standard constraint 2).
- **Pagination:** `dontBreakRows: true` will be used within each street table to keep items grouped gracefully across page boundaries. If a street breaks across a page, `pdfmake`'s built-in header repetition will be used to repeat the street name.

### 2.3 Canvassing Layout (US-005)
- Similar to Leafleting, each street is a separate `table`.
- **Elector Deduplication for Properties:** When generating rows, the logic will track the `gnaf_pid` (or exact address string). 
- If the current elector belongs to the same property as the immediately preceding elector, the `Property` and `Postcode` cells will be blanked out, and the string `(same property)` will be inserted into the property column.
- This adheres to the visual requirement while maintaining the strict 7-column width definitions required by `pdfmake`.
