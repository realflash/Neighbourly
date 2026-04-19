require 'rspec'
require 'open3'

RSpec.describe 'Application Startup' do
  it 'fails fast if DB_URL is missing' do
    # Clear DB_URL for the subprocess
    env = { 'DB_URL' => nil }
    
    # Run app.rb in a subprocess
    stdout, stderr, status = Open3.capture3(env, 'ruby app.rb')
    
    # The application should abort with a non-zero status
    expect(status.success?).to be false
    
    # It should output the specific failure message
    expect(stderr).to include('ERROR: DB_URL environment variable is missing or empty.')
  end
end
