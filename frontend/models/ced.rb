class Ced < Sequel::Model
  one_to_many :ced_output_areas
  many_to_many :campaigns, join_table: :campaign_ceds
end
