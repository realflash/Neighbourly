#TODO: class should become a proper sequel model
class ClaimService

  def initialize(db)
    @db = db
  end

  def claims(slugs, campaign_id)
    @db[:claims]
      .where('deleted_at is NULL')
      .where('mesh_block_slug IN ?', slugs.map(&:to_s))
      .where(campaign_id: campaign_id)
  end

  def claim(mesh_block, claimer, campaign_id)
    @db[:claims].insert(mesh_block_slug: mesh_block, mesh_block_claimer: claimer, claim_date: Time.now, campaign_id: campaign_id)
  end

  def unclaim(mesh_block, unclaimer, campaign_id)
    @db[:claims]
      .where(mesh_block_claimer: unclaimer)
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .update(deleted_at: Time.now)
  end

  def admin_unclaim(mesh_block, campaign_id)
    emails = ENV['ADMIN_EMAILS'].to_s.split(",").map(&:strip).map(&:downcase)

    @db[:claims]
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .where('lower(mesh_block_claimer) IN ?', emails)
      .update(deleted_at: Time.now)
  end

  def data_entry_unclaim(mesh_block, campaign_id)
    @db[:claims]
      .where(mesh_block_slug: mesh_block)
      .where(campaign_id: campaign_id)
      .update(deleted_at: Time.now)
  end

  private

  def claimer_details(email)
    @db[:users].where(email: email).first
  end

  def get_mesh_block_slugs(mesh_blocks)
    mesh_blocks.map { |mesh_block| mesh_block['_source']['slug'] }
  end
end
