Sequel.migration do
  up do
    # Ensure the table exists (it should from 011_add_elector_columns_to_addresses.rb)
    # But wait, the bounds service uses gnaf_201702 schema.
    # In my test run, I don't have that schema.
    # So I should create it.
    run "CREATE SCHEMA IF NOT EXISTS gnaf_201702"
    run "CREATE TABLE IF NOT EXISTS gnaf_201702.addresses (
      gnaf_pid text,
      locality_name text,
      postcode text,
      street_name text,
      number_first text,
      elector_name text,
      gender text,
      age integer,
      mb_2011_code text,
      alias_principal text DEFAULT 'P'
    )"
    
    # Add test data
    DB["INSERT INTO gnaf_201702.addresses (gnaf_pid, locality_name, postcode, street_name, number_first, elector_name, gender, age, mb_2011_code) VALUES 
      ('P1', 'Test Locality', 'AB1 2CD', 'Test St', '1', 'Elizabeth M. Merriman', 'F', 84, 'E00180604'),
      ('P2', 'Test Locality', 'AB1 2CD', 'Test St', '2', 'Ben Heathcote', 'M', 30, 'E00180604')
    "].insert
  end

  down do
    run "DROP TABLE IF EXISTS gnaf_201702.addresses"
  end
end
