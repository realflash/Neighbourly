Sequel.migration do
  up do
    create_table?(:ceds) do
      primary_key :id
      String :name, null: false
    end

    create_table?(:ced_output_areas) do
      foreign_key :ced_id, :ceds, null: false
      String :oa_code, null: false
      primary_key [:ced_id, :oa_code]
    end

    create_table?(:campaign_ceds) do
      foreign_key :campaign_id, :campaigns, null: false
      foreign_key :ced_id, :ceds, null: false
      primary_key [:campaign_id, :ced_id]
    end

    # Clear existing campaign wards and drop the table, since we are switching entirely to CEDs.
    drop_table?(:campaign_wards)
  end

  down do
    create_table(:campaign_wards) do
      foreign_key :campaign_id, :campaigns, null: false
      foreign_key :ward_id, :wards, null: false
      primary_key [:campaign_id, :ward_id]
    end

    drop_table(:campaign_ceds)
    drop_table(:ced_output_areas)
    drop_table(:ceds)
  end
end
