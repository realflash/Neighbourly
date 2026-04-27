#TODO: class should become a proper sequel model
class ClaimService

  def initialize(db)
    @db = db
  end

  def claims(slugs, campaign_id)
    campaign_id = campaign_id.to_i
    @db[:claims]
      .where('deleted_at is NULL')
      .where('mesh_block_slug IN ?', slugs.map(&:to_s))
      .where(campaign_id: campaign_id)
  end

  def claim(mesh_block, claimer, campaign_id)
    campaign_id = campaign_id.to_i
    existing = @db[:claims]
      .where(mesh_block_slug: mesh_block, campaign_id: campaign_id, deleted_at: nil)
      .first
      
    if existing
      @db[:claims]
        .where(id: existing[:id])
        .update(mesh_block_claimer: claimer, claim_date: Time.now, status: 'claimed')
    else
      @db[:claims].insert(
        mesh_block_slug: mesh_block, 
        mesh_block_claimer: claimer, 
        claim_date: Time.now, 
        campaign_id: campaign_id,
        status: 'claimed',
        priority: 'high'
      )
    end
  end

  def unclaim(mesh_block, unclaimer, campaign_id)
    campaign_id = campaign_id.to_i
    @db[:claims]
      .where(mesh_block_claimer: unclaimer)
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .where(deleted_at: nil)
      .update(status: 'released', mesh_block_claimer: nil)
  end

  def admin_unclaim(mesh_block, campaign_id)
    campaign_id = campaign_id.to_i
    env_emails = ENV['ADMIN_EMAILS'].to_s.split(",").map(&:strip).map(&:downcase)
    db_admin_emails = @db[:users].where(role: 'admin').select_map(:email).map(&:downcase)
    all_admin_emails = (env_emails + db_admin_emails).uniq

    @db[:claims]
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .where('lower(mesh_block_claimer) IN ?', all_admin_emails)
      .where(deleted_at: nil)
      .update(status: 'released', mesh_block_claimer: nil)
  end

  def data_entry_unclaim(mesh_block, campaign_id)
    campaign_id = campaign_id.to_i
    @db[:claims]
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .where(deleted_at: nil)
      .update(status: 'released', mesh_block_claimer: nil)
  end

  def set_priority(mesh_block, campaign_id, priority)
    campaign_id = campaign_id.to_i
    existing = @db[:claims]
      .where(mesh_block_slug: mesh_block, campaign_id: campaign_id, deleted_at: nil)
      .first

    if existing
      @db[:claims].where(id: existing[:id]).update(priority: priority)
    else
      @db[:claims].insert(
        mesh_block_slug: mesh_block,
        mesh_block_claimer: nil,
        claim_date: Time.now,
        campaign_id: campaign_id,
        status: 'released',
        priority: priority
      )
    end
  end

  def set_status(mesh_block, campaign_id, status)
    campaign_id = campaign_id.to_i
    @db[:claims]
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .where(deleted_at: nil)
      .update(status: status)
  end

  private

  def claimer_details(email)
    @db[:users].where(email: email).first
  end

  def get_mesh_block_slugs(mesh_blocks)
    mesh_blocks.map { |mesh_block| mesh_block['_source']['slug'] }
  end
end
