#!/usr/bin/env ruby

require 'csv'
require 'sequel'

db_url = ENV['DB_URL'] || 'postgres://neighbourly:neighbourly@localhost:5432/neighbourly'
db = Sequel.connect(db_url)

users_table = db[:users]

csv_file_path = File.expand_path('users.csv', __dir__)

if !File.exist?(csv_file_path)
  puts "Error: users.csv not found at #{csv_file_path}"
  exit 1
end

puts "Importing users from #{csv_file_path}..."

CSV.foreach(csv_file_path, headers: true) do |row|
  # Map headers exactly as they appear, ignoring trailing spaces using .strip on the keys if needed
  # "First name","Last Name","email ","phone","postcode","role"
  
  first_name = row['First name']&.strip
  last_name = row['Last Name']&.strip
  email = row['email ']&.strip&.downcase || row['email']&.strip&.downcase
  phone = row['phone']&.strip
  postcode = row['postcode']&.strip
  role = row['role']&.strip

  if email.nil? || email.empty?
    puts "Skipping row with missing email: #{row.to_h}"
    next
  end

  existing_user = users_table.where(email: email).first

  user_data = {
    first_name: first_name,
    last_name: last_name,
    phone: phone,
    postcode: postcode,
    role: role
  }

  if existing_user
    users_table.where(email: email).update(user_data)
    puts "Updated user: #{email}"
  else
    users_table.insert(user_data.merge(email: email, created_at: Time.now.utc))
    puts "Created user: #{email}"
  end
end

puts "User import completed successfully."
