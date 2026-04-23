require_relative 'lib/login_helpers'

describe 'UK Support Feature' do
  include_context "valid login"

  describe 'Map View Fallback and Terminology' do
    after (:each) do
      click_link('logout')
      ENV['COUNTRY'] = 'AU'
    end

    it 'should default to AU coordinates and terminology when COUNTRY is AU' do
      ENV['COUNTRY'] = 'AU'
      login
      select 'Batman', from: "electorate"
      
      # We check the region name injected into the DOM
      expect(find('#map')['data-country']).to eq('AU')
      expect(find('#map')['data-region-name']).to eq('Mesh block')
    end

    it 'should default to UK coordinates and terminology when COUNTRY is UK' do
      ENV['COUNTRY'] = 'UK'
      login
      select 'Batman', from: "electorate"

      # We check the region name injected into the DOM
      expect(find('#map')['data-country']).to eq('UK')
      expect(find('#map')['data-region-name']).to eq('Output Area')
    end
  end
end
