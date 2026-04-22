require 'acceptance_helper'

RSpec.describe 'Meshblocks bounds loading', type: :feature do
  before do
    RSpec.configuration.db[:users].delete
    RSpec.configuration.db[:users].insert(
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '0123456789',
      postcode: 'GU185TS'
    )
  end

  it 'loads meshblocks successfully without returning a 500' do
    # Login
    visit '/'
    fill_in 'email', with: 'test@example.com'
    click_button 'Log In'

    # Request the bounds directly using rack_test
    visit '/meshblocks_bounds?sey=51.349&sex=-0.679&nwy=51.352&nwx=-0.672'
    
    # We should not get a 500 error. It should return JSON or 404 if empty.
    expect([200, 404]).to include(page.status_code)
  end
end
