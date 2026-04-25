Sequel.migration do
  no_transaction

  up do
    has_table = self.fetch("SELECT 1 FROM information_schema.tables WHERE table_schema = 'gnaf_201702' AND table_name = 'addresses'").count > 0
    
    if has_table
      begin
        alter_table(Sequel.qualify(:gnaf_201702, :addresses)) do
          add_column :elector_name, String, size: 255
          add_column :gender, String, size: 10
          add_column :age, String, size: 10
        end
      rescue Sequel::DatabaseError => e
        puts "Warning during migration 010: #{e.message}"
      end
    else
      puts "Warning: gnaf_201702.addresses does not exist, skipping 010."
    end
  end

  down do
    has_table = self.fetch("SELECT 1 FROM information_schema.tables WHERE table_schema = 'gnaf_201702' AND table_name = 'addresses'").count > 0
    if has_table
      begin
        alter_table(Sequel.qualify(:gnaf_201702, :addresses)) do
          drop_column :elector_name
          drop_column :gender
          drop_column :age
        end
      rescue Sequel::DatabaseError => e
        puts "Warning during rollback 010: #{e.message}"
      end
    end
  end
end
