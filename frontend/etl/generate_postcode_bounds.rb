#!/usr/bin/env ruby
# generate_postcode_bounds.rb
# Reads the ONSPD CSV and generates pcode_bounds_uk.sql

require 'csv'
Encoding.default_external = 'UTF-8'

if ARGV.length != 1
  puts "Usage: ./generate_postcode_bounds.rb <ONSPD_UK.csv> > pcode_bounds_uk.sql"
  exit 1
end

onspd_file = ARGV[0]

puts "-- Post migration run \"psql < pcode_bounds_uk.sql\" to import"
puts "SET statement_timeout = 0;"
puts "SET lock_timeout = 0;"
puts "SET client_encoding = 'UTF8';"
puts "SET search_path = public, pg_catalog;"
puts ""
puts "DROP TABLE IF EXISTS pcode_bounds;"
puts "CREATE TABLE pcode_bounds ("
puts "    pcode character varying(255),"
puts "    swlat double precision,"
puts "    swlng double precision,"
puts "    nelat double precision,"
puts "    nelng double precision"
puts ");"
puts ""
puts "COPY pcode_bounds (pcode, swlat, swlng, nelat, nelng) FROM stdin;"

# We will just generate a 1km bounding box around every full postcode centroid
# 1 degree of latitude is ~111km. So 0.01 degrees is ~1.1km.
# 1 degree of longitude in the UK (lat 55) is ~64km. So 0.015 degrees is ~1km.

# We will also track the min/max bounds for the "Outward Code" (e.g. 'SW1A')
outward_codes = {}

CSV.foreach(onspd_file, headers: true) do |row|
  postcode = row['pcds'] # Formatted postcode, e.g. "AB1 0AA"
  lat = row['lat'].to_f
  lng = row['long'].to_f
  
  next if lat == 0.0 || lng == 0.0 || postcode.nil?

  # 1. Output the exact postcode with a small bounding box
  swlat = lat - 0.01
  nelat = lat + 0.01
  swlng = lng - 0.015
  nelng = lng + 0.015
  
  # Print full postcode bound
  row_data = [postcode, swlat, swlng, nelat, nelng]
  puts row_data.join("\t")

  # 2. Track bounds for the outward code (first half)
  outward = postcode.split(' ').first
  if outward
    if outward_codes[outward]
      curr = outward_codes[outward]
      curr[:swlat] = lat if lat < curr[:swlat]
      curr[:swlng] = lng if lng < curr[:swlng]
      curr[:nelat] = lat if lat > curr[:nelat]
      curr[:nelng] = lng if lng > curr[:nelng]
    else
      outward_codes[outward] = { swlat: lat, swlng: lng, nelat: lat, nelng: lng }
    end
  end
end

# 3. Output the outward codes
outward_codes.each do |outward, bounds|
  # Add a tiny buffer so it's a valid box even if there's only 1 point
  swlat = bounds[:swlat] - 0.005
  swlng = bounds[:swlng] - 0.005
  nelat = bounds[:nelat] + 0.005
  nelng = bounds[:nelng] + 0.005
  
  row_data = [outward, swlat, swlng, nelat, nelng]
  puts row_data.join("\t")
end

puts "\\."
puts ""
puts "CREATE INDEX idx_pcode_bounds_pcode ON pcode_bounds(pcode);"
