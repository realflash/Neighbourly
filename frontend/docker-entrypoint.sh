#!/usr/bin/env bash
set -e

if [ -z "$DB_URL" ] && [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DB_URL environment variable is missing or empty."
  exit 1
fi

echo "Running database migrations..."
bundle exec rake db:migrate

echo "Starting application..."
exec "$@"
