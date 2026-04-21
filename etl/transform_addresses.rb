#!/usr/bin/env ruby
# transform_addresses.rb
# Ingests a Sanitised Electoral CSV and the ONS UPRN Directory (OUPRD)
# Outputs SQL COPY statements to populate gnaf_201702.addresses

require 'csv'

if ARGV.length != 2
  puts "Usage: ./transform_addresses.rb <sanitised_electoral.csv> <ouprd.csv>"
  exit 1
end

sanitised_csv_path = ARGV[0]
ouprd_csv_path = ARGV[1]

puts "-- Creating schema and table"
puts "CREATE SCHEMA IF NOT EXISTS gnaf_201702;"
puts "DROP TABLE IF EXISTS gnaf_201702.addresses;"
puts "CREATE TABLE gnaf_201702.addresses ("
puts "  gnaf_pid varchar(255),"
puts "  street_name varchar(255),"
puts "  locality_name varchar(255),"
puts "  postcode varchar(255),"
puts "  alias_principal varchar(1),"
puts "  mb_2011_code varchar(255),"
puts "  number_first varchar(255)"
puts ");"
puts ""
puts "COPY gnaf_201702.addresses (gnaf_pid, street_name, locality_name, postcode, alias_principal, mb_2011_code, number_first) FROM stdin;"

# 1. Load OUPRD into memory (UPRN -> OA)
# Assuming OUPRD has headers 'uprn' and 'oa21cd'
ouprd = {}
CSV.foreach(ouprd_csv_path, headers: true) do |row|
  uprn = row['uprn'] || row['UPRN']
  oa = row['oa21cd'] || row['OA21CD'] || row['oa11cd'] || row['OA11CD']
  ouprd[uprn] = oa if uprn && oa
end

# 2. Process Sanitised Electoral CSV
CSV.foreach(sanitised_csv_path, headers: true) do |row|
  uprn = row['UPRN']
  building = row['building']
  town = row['town']
  postcode = row['postcode']
  
  oa = ouprd[uprn]
  next unless oa # Skip if we can't map it to an Output Area

  # Very basic address parsing for demonstration:
  # Split "12 High Street" into "12" and "High Street" if possible
  number_first = ""
  street_name = building
  if building && building.match(/^(\d+[a-zA-Z]*)\s+(.*)$/)
    number_first = $1
    street_name = $2
  end

  # Output the COPY line (tab separated)
  # Format: gnaf_pid, street_name, locality_name, postcode, alias_principal, mb_2011_code, number_first
  row_data = [
    uprn,
    street_name,
    town,
    postcode,
    'P', # Hardcoded alias_principal
    oa,
    number_first
  ]
  
  # Escape tabs and newlines if they exist in the data
  row_data = row_data.map { |v| v.to_s.gsub("\t", " ").gsub("\n", " ") }
  puts row_data.join("\t")
end

puts '\.'
puts ""
puts "CREATE INDEX idx_addresses_mb ON gnaf_201702.addresses(mb_2011_code);"
