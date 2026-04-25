Sequel.migration do
  up do
    alter_table(:campaigns) do
      add_column :campaign_type, String, default: 'leafleting'
    end
  end

  down do
    alter_table(:campaigns) do
      drop_column :campaign_type
    end
  end
end
