#!/usr/bin/env bash
# load_boundaries.sh
# Imports ONS Output Area shapefiles into PostGIS and transforms them to the Australian schema

set -e

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <shapefile.shp> <database_url>"
    exit 1
fi

SHAPEFILE=$1
DB_URL=$2

echo "Importing shapefile into PostGIS (temp table uk_output_areas)..."
# Convert shapefile to WGS84 (4326) and load into temporary table
ogr2ogr -f "PostgreSQL" PG:"$DB_URL" "$SHAPEFILE" \
    -nln uk_output_areas \
    -nlt MULTIPOLYGON \
    -t_srs EPSG:4326 \
    -lco GEOMETRY_NAME=geom \
    -lco OVERWRITE=YES

echo "Transforming temp table to 'admin_bdys_201702.abs_2011_mb' schema..."
psql "$DB_URL" <<EOF
CREATE SCHEMA IF NOT EXISTS admin_bdys_201702;

DROP TABLE IF EXISTS admin_bdys_201702.abs_2011_mb;

CREATE TABLE admin_bdys_201702.abs_2011_mb (
    mb_11code varchar(255),
    mb_category varchar(255),
    yes_quarantined boolean DEFAULT false,
    geom geometry(MultiPolygon, 4326)
);

INSERT INTO admin_bdys_201702.abs_2011_mb (mb_11code, mb_category, geom)
SELECT 
    "OA21CD" as mb_11code,
    'RESIDENTIAL' as mb_category,
    geom
FROM uk_output_areas;

CREATE INDEX idx_abs_2011_mb_geom ON admin_bdys_201702.abs_2011_mb USING GIST(geom);
CREATE INDEX idx_abs_2011_mb_code ON admin_bdys_201702.abs_2011_mb(mb_11code);

DROP TABLE uk_output_areas;
EOF

echo "Done!"
