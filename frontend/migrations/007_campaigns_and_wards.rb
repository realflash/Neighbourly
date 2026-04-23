Sequel.migration do
  up do
    create_table(:wards) do
      primary_key :id
      String :name, null: false
    end

    create_table(:ward_output_areas) do
      foreign_key :ward_id, :wards, null: false
      String :oa_code, null: false
      primary_key [:ward_id, :oa_code]
    end

    create_table(:campaigns) do
      primary_key :id
      String :name, null: false
      String :status, default: 'active', null: false
      DateTime :created_at, default: Sequel::CURRENT_TIMESTAMP
    end

    create_table(:campaign_wards) do
      foreign_key :campaign_id, :campaigns, null: false
      foreign_key :ward_id, :wards, null: false
      primary_key [:campaign_id, :ward_id]
    end

    alter_table(:claims) do
      add_foreign_key :campaign_id, :campaigns
    end
  end

  down do
    alter_table(:claims) do
      drop_foreign_key :campaign_id
    end
    drop_table(:campaign_wards)
    drop_table(:campaigns)
    drop_table(:ward_output_areas)
    drop_table(:wards)
  end
end
