#!/usr/bin/env ruby

require 'csv'
require 'sequel'
require 'dotenv'

Dotenv.load(File.expand_path('../../.env', __FILE__))

DB_URL = ENV['DB_URL'] || "postgres://neighbourly:neighbourly@localhost:5432/neighbourly"
db = Sequel.connect(DB_URL)

ceds_csv = ARGV[0] || "frontend/etl/CED_names_and_codes.csv"
ctyua_csv = ARGV[1] || "frontend/etl/CTYUA_APR_2025_UK_NC.csv"
onspd_csv = ARGV[2] || "frontend/etl/ONS_Postcode_Directory_(February_2026)_for_the_UK_(Hosted_Table).csv"

puts "Importing Local Authority/County names from #{ctyua_csv}..."
la_names = {}
content = File.read(ctyua_csv)
content = content.sub("\xEF\xBB\xBF", "")
CSV.parse(content, headers: true) do |row|
  code = row['CTYUA25CD']
  name = row['CTYUA25NM']
  la_names[code] = name if code && name
end
puts "Loaded #{la_names.size} local authorities."

puts "Importing CED names from #{ceds_csv}..."
ced_names = {}
content = File.read(ceds_csv)
content = content.sub("\xEF\xBB\xBF", "")
CSV.parse(content, headers: true) do |row|
  code = row['CED25CD']
  name = row['CED25NM']
  ced_names[code] = name if code && name
end
puts "Loaded #{ced_names.size} CEDs."

puts "Extracting OA to CED mappings from #{onspd_csv}..."
oa_to_ced = {}
ced_to_la = {}
count = 0
content = File.read(onspd_csv)
content = content.sub("\xEF\xBB\xBF", "")
CSV.parse(content, headers: true) do |row|
  count += 1
  puts "Processed #{count} rows..." if count % 500000 == 0
  
  oa = row['oa11cd']
  ced = row['ced25cd']
  cty = row['cty25cd']
  lad = row['lad25cd']
  
  next if oa.nil? || oa.empty? || ced.nil? || ced.empty? || ced.start_with?('E5999') || ced.start_with?('W5999')
  
  if ced_names.key?(ced)
    oa_to_ced[oa] = ced
    
    # Store the LA association for disambiguation
    unless ced_to_la.key?(ced)
      if cty && la_names.key?(cty) && !cty.start_with?('E999')
        ced_to_la[ced] = la_names[cty]
      elsif lad && la_names.key?(lad) && !lad.start_with?('E999')
        ced_to_la[ced] = la_names[lad]
      end
    end
  end
end

puts "Found #{oa_to_ced.size} unique OA to CED mappings."

puts "Inserting into database..."
db.transaction do
  # Clear existing
  db[:campaign_ceds].delete
  db[:ced_output_areas].delete
  db[:ceds].delete

  # Insert CEDs
  ced_code_to_id = {}
  ced_names.each do |code, name|
    la_name = ced_to_la[code]
    display_name = la_name ? "#{name} (#{la_name})" : "#{name} (#{code})"
    id = db[:ceds].insert(name: display_name)
    ced_code_to_id[code] = id
  end

  # Insert mappings
  mappings_to_insert = []
  oa_to_ced.each do |oa, ced|
    if ced_id = ced_code_to_id[ced]
      mappings_to_insert << {ced_id: ced_id, oa_code: oa}
    end
  end

  # Chunk inserts to avoid massive queries
  mappings_to_insert.each_slice(10000) do |chunk|
    db[:ced_output_areas].multi_insert(chunk)
  end
end

puts "Done!"
