# EPIC_004 - Standards

## 1. UI Constraints
- **Design Aesthetics**: The campaign dropdown and administration pages must be visually excellent and feel premium.
- **Typography**: Use modern typography (e.g., Inter, Roboto, or Outfit) if not already globally set.
- **Colors & Micro-animations**: Avoid generic plain colors. Ensure all new interactive elements (dropdowns, buttons for campaigns) use smooth gradients, subtle hover effects, and micro-animations to encourage interaction.
- **Form Layouts**: The Campaign Admin form must use modern glassmorphism or sleek card-based layouts.

## 2. API & Backend Constraints
- **Framework**: Use the existing Sinatra framework in Ruby.
- **Data Integrity**: Database queries must use Sequel ORM.
- **Authentication**: All campaign administration routes must be secured behind the existing admin authentication helpers.
- **Data Boundaries**: When a user selects a campaign, the map layer must ONLY show data for the selected campaign, adhering strictly to the user story constraint to not render out-of-bounds data.

## 3. Database Constraints
- **Schema**: Add a `campaigns` table. Add a `campaign_id` foreign key to relevant entities (e.g., `meshblocks` or `addresses` or `data_entries`). 
- **Migrations**: Use Sequel migrations to apply these changes securely.
