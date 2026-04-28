# Epic Board

| Epic Number | Title | Status |
| :--- | :--- | :--- |
| EPIC-001 | Functional Container | IMPLEMENTED |
| EPIC-002 | Add UK Support & Internationalisation | IMPLEMENTED |
| EPIC-003 | Bounds Service | IMPLEMENTED |
| EPIC-004 | Multi-Campaign Capabilities | IMPLEMENTED |
| EPIC-005 | Claim Properties | IMPLEMENTED |
| EPIC-006 | Campaign Type | IMPLEMENTED |
| EPIC-007 | Walk Route Improvements | IMPLEMENTED |

# Bug Board

| Bug ID | Title | Status |
| :--- | :--- | :--- |
| BUG-2604250715 | ISE when downloading PDF for a claim | FIXED |
| BUG-2604250650 | /meshblocks_bounds returning 404 | FIXED |
| BUG-2604250639 | List of CEDs is empty on /admin/campaigns | FIXED |
| BUG-2604241159 | Campaign dropdown defaults to last item instead of none | FIXED |
| BUG-2604240717 | Duplicate truncated ward names (e.g. Abbey, West) in dropdown | FIXED |
| BUG-2604250631 | admin/campaigns route fails with undefined method `campaign_type` due to missing db migrations on start | FIXED |
| BUG-2604250642 | Bounds service returns CORS error due to 500 internal server error from missing elector columns | FIXED |
| BUG-2604250658 | Elector name is unpopulated in canvassing PDF | FIXED |
| BUG-2604250750 | Canvassing template missing elector gender in parentheses | FIXED |
| BUG-2604251149 | Claimed area renders in 'complete' color (blue) instead of 'claimed' (red) | OPEN |
| BUG-2604270844 | Unclaimed high-priority area shows as 'Lower Priority' color (cream) instead of 'Higher Priority' (green) | FIXED |
| TASK-001 | Isolated test environment (run_tests.sh) | DONE |
| BUG-2604281311 | Leafleting PDF does not render any addresses | FIXED |
| BUG-2604281321 | Alpha-numeric house numbers (e.g. 34A) are incorrectly processed as named houses | FIXED |

| Bug ID | Title | Status |
| :--- | :--- | :--- |
| BUG-2604191724 | build_container.sh hangs infinitely if test DB fails to bind to port 5433 | FIXED |
| BUG-2604191744 | SCRAM authentication error occurs because DB_URL points to system Postgres (5432) instead of UAT DB (5433) | FIXED |
| BUG-2604221249 | Map stays centred on Australia after login instead of jumping to the user's postcode bounding box | FIXED |
| BUG-2604221610 | Having registered and logged in, the map doesn't load bounds correctly due to missing or unspaced postcode | FIXED |
| BUG-2604222058 | /meshblocks_bounds returns HTTP 500 due to missing LAMBDA_BASE_URL inside Docker container | FIXED |
| BUG-2604222059 | Unclaim color and persistence issue | FIXED |
| BUG-2604231009 | load_boundaries.sh fails with numeric field overflow during ogr2ogr | FIXED |
| BUG-2604231049 | transform_addresses.rb fails with UTF-8 byte sequence error on CSV | FIXED |
| BUG-2604231313 | rake db:migrate fails due to missing rspec/core/rake_task in frontend | FIXED |
| BUG-2604231324 | rake db:migrate fails due to missing sequel gem when run natively | FIXED |
| BUG-2604231333 | bundle install fails due to permission errors and Bundler 1.17.1 incompatibilities | FIXED |
| BUG-2604231342 | bundle install fails to compile native extensions for ancient gems on Ruby 3.2 | FIXED |
| BUG-2604231357 | Bounds service container crashes on startup with ISE due to old database credentials | FIXED |
