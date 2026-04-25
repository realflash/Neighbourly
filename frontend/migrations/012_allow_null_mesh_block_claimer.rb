Sequel.migration do
  up do
    # This is safe to run even if already true
    alter_table(:claims) do
      set_column_allow_null :mesh_block_claimer, true
    end
  end

  down do
    alter_table(:claims) do
      set_column_allow_null :mesh_block_claimer, false
    end
  end
end
