Sequel.migration do
  up do
    if !DB[:users].columns.include?(:role)
      alter_table(:users) do
        add_column :role, String, default: 'user'
      end
    end
  end

  down do
    alter_table(:users) do
      drop_column :role
    end
  end
end
