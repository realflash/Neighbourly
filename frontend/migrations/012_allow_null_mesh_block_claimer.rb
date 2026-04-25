Sequel.migration do
  up do
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
