class Campaign < Sequel::Model
  one_to_many :claims
  many_to_many :ceds, join_table: :campaign_ceds
  
  def active?
    status == 'active'
  end
end
