# Epic Board

| Epic Number | Title | Status |
| :--- | :--- | :--- |
| EPIC-001 | Functional Container | IMPLEMENTED |
| EPIC-002 | Add UK Support & Internationalisation | IMPLEMENTED |

# Bug Board

| Bug ID | Title | Status |
| :--- | :--- | :--- |
| BUG-2604191724 | build_container.sh hangs infinitely if test DB fails to bind to port 5433 | FIXED |
| BUG-2604191744 | SCRAM authentication error occurs because DB_URL points to system Postgres (5432) instead of UAT DB (5433) | FIXED |
| BUG-2604221249 | Map stays centred on Australia after login instead of jumping to the user's postcode bounding box | FIXED |
| BUG-2604221610 | Having registered and logged in, the map doesn't load bounds correctly due to missing or unspaced postcode | FIXED |
| BUG-2604222058 | /meshblocks_bounds returns HTTP 500 due to missing LAMBDA_BASE_URL inside Docker container | FIXED |
