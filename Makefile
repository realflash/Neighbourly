.PHONY: lint code-scan test-e2e test-e2e-isolated test-e2e-system

lint:
	cd frontend && npx eslint . || true

code-scan:
	echo "No code scan defined"

test-e2e:
	@echo "Running tests against UAT (localhost:4567)..."
	cd frontend && npx playwright test

test-e2e-isolated:
	@echo "Running tests in isolated environment..."
	@docker network create neighbourly-test-net > /dev/null 2>&1 || true
	@docker rm -f neighbourly-test-db neighbourly-test-server neighbourly-test-bounds > /dev/null 2>&1 || true
	@docker run -d --name neighbourly-test-db --network=neighbourly-test-net -e POSTGRES_PASSWORD=password -e POSTGRES_USER=postgres -e POSTGRES_HOST_AUTH_METHOD=trust -p 5435:5432 postgis/postgis:17-3.5-alpine > /dev/null
	@echo "Waiting for test DB..."
	@until docker exec neighbourly-test-db pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@sleep 2
	@docker exec neighbourly-test-db psql -U postgres -d postgres -c "CREATE EXTENSION IF NOT EXISTS hstore;" > /dev/null
	@echo "Running migrations..."
	@docker run --rm --network="host" --entrypoint "" -e DB_URL='postgres://postgres:password@127.0.0.1:5435/postgres' neighbourly-app:local bundle exec rake db:migrate > /dev/null
	@docker exec -i neighbourly-test-db psql -U postgres -d postgres < frontend/ceds.sql > /dev/null
	@docker exec -i neighbourly-test-db psql -U postgres -d postgres < frontend/tests/test_data.sql > /dev/null
	@echo "Starting test bounds service..."
	@docker run -d --name neighbourly-test-bounds --network="host" -e DATABASE_URL='postgres://postgres:password@127.0.0.1:5435/postgres' -e PORT=3001 -e BASE_PATH='/ground-bounds' -e GOOGLE_MAPS_KEY='dummy_key' -e COUNTRY='UK' neighbourly-bounds-service:local > /dev/null
	@echo "Starting test server..."
	@docker run -d --name neighbourly-test-server --network="host" --entrypoint "" -e DB_URL='postgres://postgres:password@127.0.0.1:5435/postgres' -e LAMBDA_BASE_URL='http://localhost:3001/ground-bounds' -e ADMIN_EMAILS='admin@example.com,ian@attono.net' -e PROXY_SECRET='test_proxy_secret' neighbourly-app:local bundle exec puma -p 4568 -e development > /dev/null
	@until curl -s http://localhost:4568/ > /dev/null; do sleep 1; done
	@echo "Running Playwright..."
	@cd frontend && APP_PORT=4568 TEST_DB_URL='postgres://postgres:password@127.0.0.1:5435/postgres' PLAYWRIGHT_BASE_URL="http://127.0.0.1:4568" npx playwright test --workers=1 $(TEST_ARGS)
	@echo "Cleaning up..."
	@docker stop neighbourly-test-db neighbourly-test-server neighbourly-test-bounds > /dev/null 2>&1 || true
	@docker rm neighbourly-test-db neighbourly-test-server neighbourly-test-bounds > /dev/null 2>&1 || true
	@docker network rm neighbourly-test-net > /dev/null 2>&1 || true

test-e2e-system:
	echo "No system e2e defined"
