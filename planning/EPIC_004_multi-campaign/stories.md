# EPIC_004 - Add Multi-Campaign Capabilities

The front end currenly has a dropdown which defaults to 'Warringah' indicating that there is some sort of campaign system in place. We need to track the delivery of lealets as one campaign, and door knocking as another. We also want candidates in other wards to be able to use the tool fortheir own campaigns.  

## US-001 Administer campaigns

As an administrator I want to be able to create and administer campaigns so that I can track the delivery of lealets and door knocking for different wards. 

### Acceptance Criteria

- [ ] I can add a new campaign. The following attributes are required:
    - Name (text)
    - Area (which is selected from a list of known UK wards sorted alphabetically)
- [ ] I can edit an existing campaign
- [ ] I can archive a campaign

## US-002 Selectable areas

As a user I want to select a campaign from a drop down menu so that I can see the data for a campaign.

### Acceptance Criteria

- [ ] There is a drop down menu on the map page that allows me to select a campaign. It is pre-populated with a list of all active campaigns sorted alphabetically by area. If there are no active campaigns, I am prompted to contact an administrator.
- [ ] If I have not selected a campaign, the drop down is empty
- [ ] If the drop down is empty and I click on the map, I am prompted to select a campaign
- [ ] When I select a campaign the map page is updated to show the data for that campaign. The map shows only the claimable and claimed areas for that campaign, and no claimable or claimed areas from any other campaigns. If I move the map outside of the area for the selected campaign, the map layer renders, but the bounds that overlay the map are not rendered. 
- [ ] If I click on a claimable area in the selected campaign, I am able to claim it
- [ ] If I click on a claimed area in the selected campaign, I am able to unclaim it
- [ ] If I click on a claimable area outside of the selected campaign, nothing happens
- [ ] If I click on a claimed area outside of the selected campaign, nothing happens
- [ ] If I use the data entry feature, I am required to select a campaign before I can enter data. The data entered is then associated with the selected campaign.

