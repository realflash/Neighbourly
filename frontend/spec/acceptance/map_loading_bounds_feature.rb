require 'acceptance_helper'

RSpec.describe 'Map bounds loading', type: :feature do
  before do
    # Clear and prepare test database
    DB[:users].delete
    DB[:users].insert(
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '0123456789',
      postcode: 'GU185TS' # Unspaced postcode
    )
  end

  it 'loads bounds for an unspaced postcode' do
    visit '/'
    
    # Login
    fill_in 'email', with: 'test@example.com'
    click_button 'Log In'

    # Verify we are on the map page
    expect(page.current_path).to eq('/map')

    # Wait for map bounds to load
    # The map.js will hit /pcode_get_bounds?pcode=GU185TS
    # If it fails, an alert "Postcode not found" would be triggered by Javascript
    # But since we're using rack_test, JS isn't executed.
    # So we'll test the API endpoint directly.
    visit '/pcode_get_bounds?pcode=GU185TS'
    
    # The API should return the JSON bounds
    expect(page.body).to include('swlat')
    expect(page.body).to include('51.34')
  end
end
