#!/usr/bin/env ruby
# transform_addresses.rb
# Ingests a Sanitised Electoral CSV and the ONS UPRN Directory (OUPRD)
# Outputs SQL COPY statements to populate gnaf_201702.addresses

require 'csv'
Encoding.default_external = 'UTF-8'

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

# 1. Load Sanitised Electoral CSV into memory and extract UPRNs
sanitised_records = []
target_uprns = {} # Hash for O(1) lookup: uprn -> oa

CSV.foreach(sanitised_csv_path, headers: true, encoding: 'bom|utf-8', invalid: :replace, undef: :replace, replace: '?') do |row|
  uprn = row['UPRN']
  next unless uprn
  sanitised_records << row
  target_uprns[uprn] = nil
end

# 2. Process OUPRD file(s) to find matching UPRNs
# ouprd_csv_path can be a file or a directory
ouprd_files = File.directory?(ouprd_csv_path) ? Dir.glob(File.join(ouprd_csv_path, "**", "*.csv")) : [ouprd_csv_path]

ouprd_files.each do |file|
  # We use a simple line-by-line approach to avoid memory bloat
  CSV.foreach(file, headers: true, encoding: 'bom|utf-8', invalid: :replace, undef: :replace, replace: '?') do |row|
    uprn = row['uprn'] || row['UPRN']
    next unless uprn && target_uprns.key?(uprn)
    
    oa = row['oa21cd'] || row['OA21CD'] || row['oa11cd'] || row['OA11CD']
    target_uprns[uprn] = oa if oa
  end
end

# 3. Output the COPY statements
sanitised_records.each do |row|
  uprn = row['UPRN']
  building = row['building']
  town = row['town']
  postcode = row['postcode']
  
  oa = target_uprns[uprn]
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
