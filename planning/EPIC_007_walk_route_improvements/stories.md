# EPIC 007: Walk Route Improvements

As a user, I want the order and grouping of buildings listed on the walk route to be more logical and efficient.

## US-001: Order Buildings by Street

As a user, I want buildings listed on the walk route to be grouped and ordered by street. At the moment they are listed alphabetically by building name, with adjacent addresses being separated in the list.

### Acceptance Criteria

  - After retrieving the list of properties for an area, the addresses are sorted before being rendered as a PDF. 
  - The following building name formats should be treated as being on the same street, and therefore grouped together in the walk list:
    - 12, Acacia Street
    - Squirrels Leap, 13, Acacia Street
    - 14 Acacia Street
    - Windermere, Acacia Street
  - A house with the same name as another house but on a different street would not be grouped together. For example, "Windermere, Birch Avenue" should not be grouped with "Windermere, Acacia Street".
  - There should be no de-duplication of buildings. If there are two buildings with the same name on the same street, they should both be listed in the walk list. If there are two buildings with the same name on the street, one with a number and one without, they should be listed as they are in the database. For example, "Dunroamin, Acacia Street" and "Dunroamin, 14 Acacia Street" should both be listed.
  
## US-002: Number priority

As a user, I find some houses have both names and numbers, and the current list does not prioritize the numbers in the walk list, resulting in houses being listed in a non-sequential order.

### Acceptance Criteria

   - After being sorted by street, house names should be stripped from the address where a number follows it. For example, "Squirrels Leap, 13, Acacia Street" should be listed as "13, Acacia Street" in the walk list (but subject to coalescence of numbers as describe in US-003) *The database should not be updated. The sorting should happen at the point of generating the walk list pdf*.
   - For buildings which have a name and no number, the name should be listed as it is in the database. 
  

## US-003: Address Coalescence (Number Ranges)

As a user, I want addresses with consecutive numbers on the same street to be grouped together to create a more compact and efficient walk list, and for numbers to be treated numerically rather than lexically.

### Acceptance Criteria

  - When buildings on the same street have consecutive numbers (e.g., 12, 13, 14), they should be coalesced into a single line item with a range (e.g., "12-14, Acacia Street").
  - House numbers below 10 should be treated as single digit numbers and the list sorted numerically, so that "1, 2, 3, 4, 5, 6, 7, 8, 9, 10" is the correct order, rather than the current "1, 10, 2, 3, 4, 5, 6, 7, 8, 9" which treats them as strings. At the moment they are listed as "1, 2, 3, 4, 5, 6, 7, 8, 9, 10".
  - This coalescence should happen after the initial sort by street and after stripping house names (as per US-002).
  - If there are gaps in the sequence (e.g., 12, 14, 16), only the consecutive numbers should be coalesced (e.g., "12, 14, 16"), not the entire range.
  - The database should not be updated. The coalescence should happen at the point of generating the walk list PDF.

## US-004: Odd/even split

As a user, I want addresses to be listed with the odd and even numbers on opposite sides of the street as my tendency is to walk down one side of the street and then back up the other side of the street. As a developer I want this splitting to be an option, recognising that other countries may not use this convention.

### Acceptance Criteria

  - An env var SPLIT_ODD_EVEN should be created. If it is set to true, then the odd and even numbers should be listed as separate rows within the table for that street.
  - The odd even split should happen after the coalescence of numbers as described in US-003. 
  - Split numbers should be appended with  either (odd) or (even) to indicate which side of the street they are on.
  - The odd even split should respect the gaps in numbers. For example, houses 1-9 and 15-21 should be listed as "1-9 (odd)" and "15-21 (odd)" on separate rows, and not as "1-21 (odd)".
  - If there are no buildings with an odd or even number on a street, then the split should apply anyway, and a row with "No buildings (odd)" and "No buildings (even)" should be listed as the case may be.

## US-005: Walk list layout (leaflet campaign)

As a user, I want the walk list to be laid out in a way that is easy to read and follow. 

### Acceptance Criteria

 - The output templates for all campaign types should group all the properties for a given street together in one table, headed by the street name. For example:
 - For the leaflet campaign template, the layout should be in two columns. The left half of the page should be for houses with numbers, and the right half should be for houses with names. This allows the user to keep an eye out for the listed named houses whilst they are following the number sequence. 
 - The right half of the page should be grouped by street, and match with the streets on the left half of the page. For example, if the numbered houses on the left occupy two rows, but the named houses on the right occupy three, the left hnad column would be empty for the last row. A new table would then start for the next street.
|
  **<Street name>** 

  |<list of house numbers>|             |<named house 1>|
  |<list 2 of house numbers>|             |<named house 2>|
  |<list 3 of house numbers>|             |<named house 3>|

  **<ANother Street name>** 

  |<list of house numbers>|             |<named house 1>|
  |<list 2 of house numbers>|             |<named house 2>|
  |<list 3 of house numbers>|             |<named house 3>|

There are distinct columns of content in separate tables, not distinct columns within a table.

 - Table rows do not break across pages. Each row from the street list should be on the same page as the corresponding named houses for that street. 
 - Where tables break across pages, the street name header should be repeated for the second part of the table.
 - At the top of the first page there should be the following information:
  - Campaign name
  - Assignee name
  - Area code
  - Sentence listing the streets in the walk list, such as "Covering Acacia Street, Birch Avenue, and Chestnut Drive." This sentence should be on one line. Buildings with no sreet name are not included in this list. 

## US-005: Walk list layout (canvassing campaign)

As a user, I want the walk list to be laid out in a way that is easy to read and follow. 

### Acceptance Criteria

 - The output templates for all campaign types should group all the properties for a given street together in one table, headed by the street name. For example:
   **<Street name>** 
   |<property 1>|Existing content...
   |<property 2>|Existing content...

   **ANother Street name**
   |<property 1>|Existing content...
   |<property 2>|Existing content...

 - Table rows do not break across pages. Each row from the street list should be on the same page as the corresponding named houses for that street. 
 - Where tables break across pages, the street name header should be repeated for the second part of the table.
 - At the top of the first page there should be the following information:
  - Campaign name
  - Assignee name
  - Area code
  - Sentence listing the streets in the walk list, such as "Covering Acacia Street, Birch Avenue, and Chestnut Drive." This sentence should be on one line. Buildings with no sreet name are not included in this list. 
 - Wher there are multiple electors at the same property, only the first elector for that property should have the property details listed. The subsequent electors should be listed with only their name and "(same property)" in the property column. This makes it easier to determine the number of properties to visit. For example:

    **<Street name>** 
   |<property 1>|<elector 1>...
   |            |<elector 2>...
   |            |<elector 3>...
   |<property 2>|<elector 1>...
   |            |<elector 2>...



 

