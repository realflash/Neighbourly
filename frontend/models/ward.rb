class Ward < Sequel::Model
  many_to_many :campaigns, join_table: :campaign_wards
  one_to_many :ward_output_areas
end
