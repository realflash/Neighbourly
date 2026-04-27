#!/usr/bin/env bash
# load_test_data.sh
# Recreates and populates the local UAT database with UK datasets

set -e

DB_URL="${DB_URL:-postgres://neighbourly:neighbourly@localhost:5432/neighbourly}"

# Ensure the DB container is running
if [ ! "$(docker ps -q -f name=^/neighbourly-db$)" ]; then
    echo "Starting neighbourly-db container..."
    if [ "$(docker ps -aq -f name=^/neighbourly-db$)" ]; then
        docker start neighbourly-db
    else
        docker run --name neighbourly-db \
            -e POSTGRES_PASSWORD=neighbourly \
            -e POSTGRES_DB=neighbourly \
            -e POSTGRES_USER=neighbourly \
            -e POSTGRES_HOST_AUTH_METHOD=md5 \
            -e POSTGRES_INITDB_ARGS="--auth-host=md5 --auth-local=md5" \
            -p 5432:5432 \
            -d ghcr.io/cloudnative-pg/postgis:17 \
            -c password_encryption=md5
    fi
    echo "Waiting for database to be ready..."
    until docker exec neighbourly-db pg_isready -U neighbourly > /dev/null 2>&1; do
        sleep 2
    done
fi

echo "Recreating database..."
docker exec -e PGPASSWORD=neighbourly neighbourly-db psql -U neighbourly -d postgres -c "DROP DATABASE IF EXISTS neighbourly WITH (FORCE);"
docker exec -e PGPASSWORD=neighbourly neighbourly-db psql -U neighbourly -d postgres -c "CREATE DATABASE neighbourly;"
docker exec -e PGPASSWORD=neighbourly neighbourly-db psql -U neighbourly -d neighbourly -c "CREATE EXTENSION IF NOT EXISTS postgis;"
docker exec -e PGPASSWORD=neighbourly neighbourly-db psql -U neighbourly -d neighbourly -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"

echo "Running migrations..."
docker run --rm --network="host" -e DATABASE_URL="$DB_URL" neighbourly-app:local bundle exec rake db:migrate

echo "Importing CEDs (this will take several minutes)..."
docker run --rm --network="host" -v $(pwd)/frontend/etl:/app/frontend/etl -e DB_URL="$DB_URL" neighbourly-app:local bundle exec ruby frontend/etl/import_ceds.rb frontend/etl/CED_names_and_codes.csv frontend/etl/CTYUA_APR_2025_UK_NC.csv "frontend/etl/ONS_Postcode_Directory_(February_2026)_for_the_UK_(Hosted_Table).csv"

echo "Loading postcode boundaries (this may take a minute)..."
psql "$DB_URL" < frontend/etl/pcode_bounds_uk.sql

echo "Loading Output Area boundaries..."
./frontend/etl/load_boundaries.sh frontend/etl/Output_Areas_2021_EW_BGC_V2_-8984118975264007608/OA_2021_EW_BGC_V2.shp "$DB_URL"

echo "Loading target addresses (Lightwater area)..."
psql "$DB_URL" < frontend/etl/lwb_targets.sql

echo "Running migrations again (to ensure elector columns exist)..."
docker run --rm --network="host" -e DATABASE_URL="$DB_URL" neighbourly-app:local bundle exec rake db:migrate

echo "Done! Your UAT DB is now populated with UK datasets."
