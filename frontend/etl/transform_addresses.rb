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
puts "  number_first varchar(255),"
puts "  elector_name varchar(255),"
puts "  gender varchar(10),"
puts "  age varchar(10)"
puts ");"
puts ""
puts "COPY gnaf_201702.addresses (gnaf_pid, street_name, locality_name, postcode, alias_principal, mb_2011_code, number_first, elector_name, gender, age) FROM stdin;"

# 1. Load Sanitised Electoral CSV into memory and extract UPRNs
sanitised_records = []
target_uprns = {} # Hash for O(1) lookup: uprn -> oa

headers = nil
File.foreach(sanitised_csv_path, mode: 'rb:bom|utf-8') do |raw_line|
  line = raw_line.scrub('?')
  if headers.nil?
    headers = CSV.parse_line(line)
  else
    fields = CSV.parse_line(line)
    next unless fields
    row = CSV::Row.new(headers, fields)
    uprn = row['UPRN']
    next unless uprn
    sanitised_records << row
    target_uprns[uprn] = nil
  end
end

# 2. Process OUPRD file(s) to find matching UPRNs
# ouprd_csv_path can be a file or a directory
ouprd_files = File.directory?(ouprd_csv_path) ? Dir.glob(File.join(ouprd_csv_path, "**", "*.csv")) : [ouprd_csv_path]

ouprd_files.each do |file|
  # We use a simple line-by-line approach to avoid memory bloat
  uprn_idx = nil
  oa_idx = nil
  File.foreach(file, mode: 'rb:bom|utf-8') do |raw_line|
    line = raw_line.scrub('?')
    if uprn_idx.nil?
      headers = CSV.parse_line(line)
      uprn_idx = headers.index('uprn') || headers.index('UPRN') || 0
      oa_idx = headers.index('oa21cd') || headers.index('OA21CD') || headers.index('oa11cd') || headers.index('OA11CD')
    else
      # Fast UPRN check (assuming UPRN is usually the first column, or we just extract the first field)
      first_val = line.split(',', 2).first.to_s.delete('"')
      # We just check if first_val is a target UPRN. If uprn_idx is not 0, this might miss, but usually UPRN is 1st.
      # If not, we fallback to parsing
      if uprn_idx == 0
        next unless target_uprns.key?(first_val)
      end
      
      fields = CSV.parse_line(line)
      next unless fields
      uprn = fields[uprn_idx]
      next unless uprn && target_uprns.key?(uprn)
      
      oa = fields[oa_idx]
      target_uprns[uprn] = oa if oa
    end
  end
end

# 3. Output the COPY statements
sanitised_records.each do |row|
  uprn = row['UPRN']
  building = row['building']
  town = row['town']
  postcode = row['postcode']
  elector_name = row['Elector Name'] || row['elector_name'] || [row['firstName'], row['middleNames'], row['lastName']].compact.join(' ').gsub(/\s+/, ' ').strip
  gender = row['Gender'] || row['gender'] || row['estimatedGender'] || ''
  age = row['Age'] || row['age'] || row['estimatedAge'] || ''
  
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
    number_first,
    elector_name,
    gender,
    age
  ]
  
  # Escape tabs and newlines if they exist in the data
  row_data = row_data.map { |v| v.to_s.gsub("\t", " ").gsub("\n", " ") }
  puts row_data.join("\t")
end

puts '\.'
puts ""
puts "CREATE INDEX idx_addresses_mb ON gnaf_201702.addresses(mb_2011_code);"
