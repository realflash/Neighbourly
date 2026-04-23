class Campaign < Sequel::Model
  many_to_many :wards, join_table: :campaign_wards
  
  def active?
    status == 'active'
  end
end
