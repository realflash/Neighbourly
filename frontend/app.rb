require 'sinatra'
require "sinatra/reloader" if development?
require 'byebug' if development?
require 'dotenv'
require 'haml'
require 'sequel'
require 'time'
require "httparty"
require 'json'
require 'sinatra/flash'
require 'sinatra/json'
require 'sinatra/cookies'

require_relative "lib/login_helper"
require_relative 'lib/view_helper'
require_relative './services/claim_service'
require_relative './services/geo_service'
Dotenv.load
enable :sessions
set :session_secret, ENV["SECRET_KEY_BASE"]
set :unclaim_token, ENV['DATA_ENTRY_UNCLAIM_TOKEN']

before do
  # SSO via proxy (election-tools)
  # We check for a shared secret to ensure the request is coming from our proxy
  proxy_email = request.env['HTTP_X_FORWARDED_EMAIL']
  proxy_secret = request.env['HTTP_X_PROXY_SECRET']
  
  if proxy_email && proxy_secret && proxy_secret == ENV['PROXY_SECRET']
    # If the user is not already authorised as this email, authorise them
    unless authorised? && user_email == proxy_email.downcase
      puts "SSO Auth for: #{proxy_email}"
      authorise(proxy_email)
    end
  end
end

abort("ERROR: DB_URL environment variable is missing or empty.") if ENV['DB_URL'].nil? || ENV['DB_URL'].empty?

DB = Sequel.connect(ENV['DB_URL']) unless defined?(DB)
Sequel::Model.db = DB

require_relative "models/user"
require_relative "models/ced_output_area"
require_relative "models/ced"
require_relative "models/campaign"

def test_db_connection
  Sequel.connect(ENV['TEST_DB_URL'] || "postgres://localhost/neighbourly_test")
end

configure do
  set :db, DB
end

configure :production do
  set :db, DB
end

configure :test do
  set :db, test_db_connection
end

Sequel.datetime_class = DateTime

set :absolute_redirects, false

helpers do
  def url(addr = nil, absolute = false, add_script_name = true)
    super(addr, false, add_script_name)
  end
  alias to url
end

get '/' do
  if authorised?
    redirect to('/map')
  else
    haml :main, locals: {page: 'main', body: 'main'}
  end
end

def login_attempt
  #Primary login method is e-mail
  #If a param is passed (form or URL) - use that
  #If a cookie is set - use that secondarily
  #If no e-mail is present, send to the frontpage
  if params.has_key?("email")
    authorise(params[:email].strip)
  elsif cookies.has_key?("email")
    authorise(cookies[:email])
  else
    redirect to('/')
  end

  user_params = Hash.new
  fields = ["email", "first_name", "last_name", "phone", "postcode"]

  #Check that user exists for current e-mail
  if authorised?
    redirect to('/map')

  #If e-mail is set in param - go straight to the user_details page
  elsif params.has_key?("email")
    redirect to("/user_details?email=#{CGI.escape(user_email)}")

  #If user does not exist and all fields exist in cookie - create_user
  elsif fields.all? {|s| cookies.key? s}
    fields.each do |key_get|
      user_params[key_get] = cookies[key_get]
    end
  create_user(user_params)
  redirect to('/map')

  end
end

get '/login' do
  login_attempt
end

post '/login' do
  login_attempt
end

get "/user_details" do
  haml :user_details, locals: {page: "user_details", email: params[:email] }
end

def create_user(user_params)
  puts "Creating user: #{user_params}"
  user = User.new(settings.db)
  #Submit user details to database
  #And, Catch double-submission errors and send details to Zapier
  begin
    if user.create!(user_params)

      #Send user details to the Zapier endpoint
      if ENV["ZAP_API_ON"] == "True"
        HTTParty.post(ENV["ZAP_API"],:body => user_params, timeout: 2)
      end

      #Once the user is created - authorise them
      authorise(user_params['email'])
      redirect to('/map')
    else
      #TODO - needs validation
      flash[:error] = "Please enter correct details."
      haml :user_details
    end

  #Skip all errors and retry auth without ZAP_API call
  #REDUNDANT - Skip details re-entry if e-mail already exists in database
  #REDUNDANT - Skip if HTTParty fails to make the API call
rescue Sequel::UniqueConstraintViolation, HTTParty::Error => e
    puts "Error in User Details Submission: #{e.message}"
    authorise(user_params['email'])
    redirect to('/map')
  end
end

post "/user_details" do
  create_user(params[:user_details])
end

get '/map' do
  authorised do
    haml :map, locals: {page: 'map'}
  end
end

get '/logout' do
  session.clear
  flash[:notice] = 'You have been logged out.'
  redirect to('/')
end

get '/api/campaigns' do
  authorised do
    campaigns = Campaign.where(status: 'active').order(:name).all.map do |c|
      { id: c.id, name: c.name, ced_ids: c.ceds.map(&:id), type: c.campaign_type }
    end
    puts "DEBUG: Returning campaigns: #{campaigns.inspect}"
    json campaigns
  end
end

get '/admin/campaigns' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    @campaigns = Campaign.order(:name).all
    @ceds = Ced.order(:name).all
    haml :campaigns, locals: {page: 'campaigns'}
  end
end

post '/admin/campaigns' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    name = params[:name]
    type = params[:type] || 'leafleting'
    ced_ids = params[:ced_ids] || []
    
    if name && !name.empty? && !ced_ids.empty?
      campaign = Campaign.create(name: name, status: 'active', campaign_type: type)
      ced_ids.each do |c_id|
        campaign.add_ced(Ced[c_id.to_i])
      end
      flash[:notice] = 'Campaign created successfully.'
    else
      flash[:error] = 'Name and at least one CED are required.'
    end
    redirect to('/admin/campaigns')
  end
end

post '/admin/campaigns/:id/archive' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    campaign = Campaign[params[:id].to_i]
    if campaign
      campaign.update(status: 'archived')
      flash[:notice] = 'Campaign archived.'
    end
    redirect to('/admin/campaigns')
  end
end

get '/admin/campaigns/:id/edit' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    @campaign = Campaign[params[:id].to_i]
    @ceds = Ced.order(:name).all
    redirect to('/admin/campaigns') unless @campaign
    haml :campaign_edit, locals: {page: 'campaigns'}
  end
end

post '/admin/campaigns/:id' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    campaign = Campaign[params[:id].to_i]
    if campaign
      name = params[:name]
      type = params[:type] || 'leafleting'
      ced_ids = params[:ced_ids] || []
      
      if name && !name.empty? && !ced_ids.empty?
        campaign.update(name: name, campaign_type: type)
        campaign.remove_all_ceds
        ced_ids.each do |c_id|
          campaign.add_ced(Ced[c_id.to_i])
        end
        flash[:notice] = 'Campaign updated.'
      else
        flash[:error] = 'Name and at least one CED are required.'
      end
    end
    redirect to('/admin/campaigns')
  end
end

def claim_status(claim)
  return claim[:status] if claim[:status] == 'complete'
  return 'released' if claim[:status] == 'released' || claim[:mesh_block_claimer].nil?

  if claim[:mesh_block_claimer] == session[:user_email]
    "claimed_by_you"
  else
    "claimed"
  end
end

def get_meshblocks_with_status(json, campaign_id)
  begin
    if json["features"].nil?
      puts "WARNING: json['features'] is nil in get_meshblocks_with_status"
      return json
    end
    slugs = json["features"].map{|feature| 
      if feature["properties"].nil? || feature["properties"]["slug"].nil?
        puts "WARNING: missing slug in feature properties: #{feature.inspect}"
        nil
      else
        feature["properties"]["slug"]
      end
    }.compact
    claim_service = ClaimService.new(settings.db)
    claims = claim_service.claims(slugs, campaign_id.to_i)

  claim_data = claims.map do |c|
    owner_name = nil
    if c[:mesh_block_claimer]
      user = settings.db[:users].where(email: c[:mesh_block_claimer]).first
      owner_name = "#{user[:first_name]} #{user[:last_name]}".strip if user
    end
    [ c[:mesh_block_slug], { status: claim_status(c), priority: c[:priority], owner_name: owner_name } ]
  end.to_h

  json["features"] = json["features"].map do |feature|
    data = claim_data[feature["properties"]["slug"].to_s]
    if data
      feature["properties"]["claim_status"] = data[:status]
      feature["properties"]["claim_priority"] = data[:priority]
      feature["properties"]["claim_owner_name"] = data[:owner_name]
    else
      feature["properties"]["claim_status"] = "unclaimed"
    end
    feature
  end

    json
  rescue => e
    puts "ERROR in get_meshblocks_with_status: #{e.message}"
    puts e.backtrace.join("\n")
    raise e
  end
end

post '/claims/:id/priority' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    claim_service = ClaimService.new(settings.db)
    claim_service.set_priority(params['id'], params['campaign_id'], params['priority'])
    status 200
  end
end

post '/claims/:id/status' do
  authorised do
    claim_service = ClaimService.new(settings.db)
    claim = settings.db[:claims].where(mesh_block_slug: params['id'], campaign_id: params['campaign_id'], deleted_at: nil).first
    if is_admin?(user_email) || (claim && claim[:mesh_block_claimer] == user_email) || params['status'] == 'complete'
      claim_service.set_status(params['id'], params['campaign_id'], params['status'], user_email)
      status 200
    else
      status 403
    end
  end
end

get '/api/users' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    users = settings.db[:users].select(:email, :first_name, :last_name).all
    json users.map { |u| { email: u[:email], name: "#{u[:first_name]} #{u[:last_name]}".strip } }
  end
end

post '/claims/:id/user' do
  authorised do
    redirect to('/') unless is_admin?(user_email)
    claim_service = ClaimService.new(settings.db)
    claim_service.set_claimer(params['id'], params['campaign_id'], params['user_email'])
    status 200
  end
end

get '/debug_meshblocks' do
  url = "#{ENV['LAMBDA_BASE_URL']}/territories/bounds"
  response = HTTParty.get(url, {query: params})
  data = JSON.parse response.body
  json get_meshblocks_with_status(data, params[:campaign_id])
end

#For loading new SA1s when scrolling on the map
get '/meshblocks_bounds' do
  # authorised do
    url = "#{ENV['LAMBDA_BASE_URL']}/territories/bounds"
    response = HTTParty.get(url, {query: params})
    
    if response.code != 200
      puts "500 due to bounds service returning #{response.code}"
      status 500
      return json({error: 'Internal Server Error from bounds service'})
    end
    
    data = JSON.parse response.body

    if data['features'] == nil
        puts "404 due to map location returning no meshblocks"
        status 404
    else
      if params[:campaign_id] && !params[:campaign_id].empty?
        campaign = Campaign[params[:campaign_id].to_i]
        if campaign
          # Preload for performance since we could have multiple ceds
          valid_oas = campaign.ceds.map { |c| c.ced_output_areas.map(&:oa_code) }.flatten.uniq
          data['features'].select! { |f| valid_oas.include?(f["properties"]["slug"]) }
        end
      end
      
      json get_meshblocks_with_status(data, params[:campaign_id])
    # end
  end
end

#For finding out the bounds of a postcode
get '/pcode_get_bounds' do
  authorised do
    geo_service = GeoService.new(settings.db)
    bounds = geo_service.pcode_bounds(params[:pcode])
    json bounds[0]
  end
end

post '/claim_meshblock/:id' do
  authorised do
    claim_service = ClaimService.new(settings.db)
    claim_service.claim(params['id'], user_email, params['campaign_id'])
    status 200
  end
end

post '/unclaim_meshblock/:id' do
  authorised do
    claim_service = ClaimService.new(settings.db)
    #TODO - return error on fail
    if is_admin?(user_email)
      ENV['ADMIN_UNCLAIM_ANY'] == 'true' \
        ? claim_service.data_entry_unclaim(params['id'], params['campaign_id']) \
        : claim_service.admin_unclaim(params['id'], params['campaign_id'])
    else
      claim_service.unclaim(params['id'], user_email, params['campaign_id'])
    end
    status 200
  end
end

get '/data_entry' do
  haml :data_entry, locals: {page: 'data_entry'}, layout: false
end

post '/survey' do
  authorised do
    haml :data_entry, locals: {page: 'data_entry'}
  end
end

post '/unclaim_from_data_entry' do
  data = JSON.parse request.body.read

  return 400 unless settings.unclaim_token &&
    settings.unclaim_token.length > 5 &&
    settings.unclaim_token == data['token']

  ClaimService.new(settings.db).data_entry_unclaim(data['id'], data['campaign_id'])
  status 200
end
