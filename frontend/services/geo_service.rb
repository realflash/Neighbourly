#Geospatial Queries

class GeoService

  def initialize(db)
    @db = db
  end

  def pcode_bounds(pcode)
    normalized_pcode = pcode.to_s.gsub(/\s+/, '').upcase
    normalized_pcode.insert(-4, ' ') if normalized_pcode.length >= 5

    @db[:pcode_bounds]
    .where(pcode: normalized_pcode)
    .select(:swlat,:swlng,:nelat,:nelng)
    .map { |row|
    {"swlat" => row[:swlat], "swlng" => row[:swlng], "nelat" => row[:nelat], "nelng" => row[:nelng]}}
  end

end
