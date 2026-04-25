Sequel.migration do
  up do
    if !DB[:campaigns].columns.include?(:campaign_type)
      alter_table(:campaigns) do
        add_column :campaign_type, String, default: 'leafleting'
      end
    end
  end

  down do
    alter_table(:campaigns) do
      drop_column :campaign_type
    end
  end
end
