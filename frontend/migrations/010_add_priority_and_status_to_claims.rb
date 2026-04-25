Sequel.migration do
  up do
    if !DB[:claims].columns.include?(:priority)
      alter_table(:claims) do
        add_column :priority, String, default: 'high'
      end
    end
    if !DB[:claims].columns.include?(:status)
      alter_table(:claims) do
        add_column :status, String, default: 'claimed'
      end
    end
    
    # Backfill existing active claims
    from(:claims).where('deleted_at IS NULL').update(status: 'claimed')
    # Convert soft-deleted claims to 'released'
    from(:claims).where('deleted_at IS NOT NULL').update(status: 'released')
  end

  down do
    alter_table(:claims) do
      drop_column :priority
      drop_column :status
    end
  end
end
