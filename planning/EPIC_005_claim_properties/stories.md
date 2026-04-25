# EPIC 005 - Claim Properties

## US-001 Claim priority

As an administrator of the campaign, I want to be able to set the priority of claims so that I target the right areas first.

### Acceptance Criteria

Existing functionality: in the bottom right corner of the map there is a key that shows the legend for the map. It includes high and low priority claims. 
- [ ] As an admin, when I click on a claim I see a drop-down box with options of high and low priority (high is default). The wording matches that in the key.
- [ ] As an admin, when I change the priority of a claim, the map updates to show the new priority. 
- [ ] As an admin, If I click on the claim a second time, I can see the drop down menu again and successfully change the priority.
- [ ] As a user, when I click on a claim, I see the priority of the claim, but I cannot change it. 
- [ ] As anyone, the colour of the claim overlay on the map matches the key.

## US-002 Claim status

As a user, I want to mark the completion of a claim so that everyone knows which areas have been completed.

### Acceptance Criteria

- [ ] As a user, when I click on a claim which belongs to me, I see a button to mark it as complete. 
- [ ] As a user, when I click on the complete button, the claim is marked as complete and the map updates to show the claim in the complete colour (as per the key).
- [ ] As a user, if I click on a claim which does not belong to me, I do not see a button to mark it as complete. 
- [ ] As an admin, I can click on any claim and see a button to mark it as complete whether or not it belongs to me. Completing a claim marks it as complete whether or not it belongs to me. 
- [ ] In the key, the colour for 'Organised Event' is replaced with 'Complete'. This matches the complete colour for claims.

## US-003 User name on claim

As a user, I want to see the name of the user who claimed a claim so that I know who to contact if I have any questions.

### Acceptance Criteria

- [ ] As anyone, when I click on a claim, I see the name of the user who claimed it. The name is the name of the user who claimed it (not the email address).

## US-004 released claim colour

As anyone, I want to released and incomplete claims to have their standard colour according to priority so that I can see that it still needs to be done.

### Acceptance Criteria

- [ ] As anyone, when I click Unclaim, the claim is released and its colour changes to the standard released colour (according to priority).
- [ ] As anyone, if I scroll the map away from the claim so that the claim is no longer visible, and then scroll back so that it is visible, its colour is unchanged.