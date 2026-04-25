# EPIC_006 - Campaign Type

Different campaign types require different guidance to users and different PDF output. We should be able to configure the type of campaign and have the system adapt accordingly.

## US-001 Campaign Type

As an administrator, I want to be able to set the type of campaign so that the system adapts accordingly.

### Acceptance Criteria

- [x] As an admin, when creating a campaign, I see a drop down box to select the type of campaign (default is leafleting). The possible options are.
    - [x] Leafleting
    - [x] Canvassing
- [x] Next to the drop-down box is guidance explaining that changing the type will change the PDFs generated: 
- [x] As an admin, when I edit a campaign, I can change the type of campaign.

## US-002 Leafleting PDF content

As an administrator, I want the leafleting PDF to be briefer so that volunteers delivering the laeaflets can focus just on the houses on the route. There is no need for the PDF contain any checkboxes for collecting responses - it should just present the list of properties.

### Acceptance Criteria

- [x] As an anyone, when I download a claim PDF for a leafleting campaign, the PDF should contain the following:
    - The map of the claim as it currently does
    - The list of properties as it currently does, one on each line. Each line should contain the full address of the property, so that isolated properties are easy to find. 
    - There should be no checkboxes for collecting responses.
    - Where there are multiple numbered properties on the same street (e.g. 1-4, 2-6, etc.), they should be listed on the same line separated by a hyphen (e.g. 1-4 Main Street).
    - The list should be retain the current order of the properties (typically in street order).

## US-003 Canvassing PDF content

As an administrator, I want the canvassing PDF to include checkboxes for collecting responses so that volunteers can collect responses from residents. Note that the electoral roll data read by frontend/etl/transform_addresses.rb already includes information on every elector (and appears to be importing each UPRN once for each elector already, resulting in duplicates in the PDF output), so elector information can be easily made available.

### Acceptance Criteria

- [x] As an anyone, when I download a claim PDF for a canvassing campaign, the PDF should contain the following:
    - The map of the claim as it currently does
    - The list should be retain the current order of the properties (typically in street order).
    - The columns should be:
        - [x] UPRN & Building (populated from DB)
        - [x] Postcode (populated from DB)
        - [x] Elector name, gender and age (populated from DB)
        - [x] Unsuccessful (blank)
        - [x] Refused (blank)
        - [x] Postal vote
        - [x] Response code (blank)
    - THere should be one row per elector.

        
