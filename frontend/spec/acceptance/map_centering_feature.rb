require_relative '../acceptance_helper'
require_relative 'lib/login_helpers'

describe 'Map Centering Feature', type: :feature do
  include_context "valid login"
  before { Capybara.current_driver = :rack_test }

  it 'should centre on the user\'s postcode bounding box after login' do
    login
    # After login, the user is redirected to the map page.
    # The map div should have the user's postcode in its data attributes.
    expect(page).to have_css('#map')
    expect(page.find('#map')['data-postcode']).to eq('2042')
  end
end
