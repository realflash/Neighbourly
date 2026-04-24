require './app.rb'

map ENV['RACK_BASE_URI'] || '/' do
  run Sinatra::Application
end