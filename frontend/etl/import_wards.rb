#!/usr/bin/env ruby

require 'csv'
require 'sequel'
require 'dotenv'

Dotenv.load(File.expand_path('../../.env', __FILE__))

DB_URL = ENV['DB_URL'] || "postgres://neighbourly:neighbourly@localhost:5432/neighbourly"
db = Sequel.connect(DB_URL)

wards_csv = ARGV[0] || "frontend/etl/Wards_(May_2025)_Names_and_Codes_in_the_UK.csv"
onspd_csv = ARGV[1] || "frontend/etl/ONS_Postcode_Directory_(February_2026)_for_the_UK_(Hosted_Table).csv"

puts "Importing Ward names from #{wards_csv}..."
ward_names = {}
# Strip BOM
content = File.read(wards_csv)
content = content.sub("\xEF\xBB\xBF", "")
CSV.parse(content, headers: true) do |row|
  code = row['WD25CD']
  name = row['WD25NM']
  ward_names[code] = name if code && name
end

puts "Loaded #{ward_names.size} wards."

# We need to map oa11cd to wd25cd.
# The ONSPD is large (~2.6M rows). We only need unique oa11cd -> wd25cd mappings.
puts "Extracting OA to Ward mappings from #{onspd_csv}..."
oa_to_ward = {}
count = 0
content = File.read(onspd_csv)
content = content.sub("\xEF\xBB\xBF", "")
CSV.parse(content, headers: true) do |row|
  count += 1
  puts "Processed #{count} rows..." if count % 500000 == 0
  
  oa = row['oa11cd']
  wd = row['wd25cd']
  
  next if oa.nil? || oa.empty? || wd.nil? || wd.empty?
  
  # Only map if we know the ward's name (e.g. ignoring pseudo-codes like E05999999)
  if ward_names.key?(wd)
    oa_to_ward[oa] = wd
  end
end

puts "Found #{oa_to_ward.size} unique OA to Ward mappings."

puts "Inserting into database..."
db.transaction do
  # Clear existing
  db[:campaign_wards].delete
  db[:ward_output_areas].delete
  db[:wards].delete

  # Insert wards
  ward_code_to_id = {}
  ward_names.each do |code, name|
    display_name = "#{name} (#{code})"
    id = db[:wards].insert(name: display_name)
    ward_code_to_id[code] = id
  end

  # Insert mappings
  mappings_to_insert = []
  oa_to_ward.each do |oa, wd|
    if ward_id = ward_code_to_id[wd]
      mappings_to_insert << {ward_id: ward_id, oa_code: oa}
    end
  end

  db[:ward_output_areas].multi_insert(mappings_to_insert)
end

puts "Done!"
