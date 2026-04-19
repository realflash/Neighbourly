# EPIC 2 - Modernisation

## US-001: Migrate to a modern, supported Ruby version

As a developer, I want to upgrade the application's Ruby version from the deprecated 2.3.3 to a modern, actively supported version (e.g., Ruby 3.2 or 3.3), so that the application is secure, performant, and compatible with modern libraries and databases.

## Acceptance Criteria

- The base image in the `Dockerfile` is updated to a modern Ruby image (e.g., `ruby:3.2-slim`).
- The `Gemfile` and `Gemfile.lock` are updated to support the new Ruby version.
- All incompatible gem dependencies are bumped to versions that support the modern Ruby runtime.
- The container builds successfully via `build_container.sh` without fatal errors.
- The application can successfully connect to a modern PostgreSQL database (version 14/15) utilizing SCRAM-SHA-256 authentication (resolving the legacy `libpq` limitation).
- All automated tests in the pipeline pass successfully against the upgraded runtime.
- The application boots up and serves traffic on `localhost:4567` without crashing.

## US-002: Upgrade PostgreSQL to version 15 or higher

As a developer, I want to upgrade the application's supported PostgreSQL version from the legacy 9.4 to at least version 15, so that the application benefits from modern performance improvements, security patches, and SCRAM-SHA-256 authentication.

### Acceptance Criteria

- The local test database instantiated during `build_container.sh` uses a `postgres:15` (or higher) Docker image.
- The `pg` gem and `sequel` gem are verified to work correctly with PostgreSQL 15.
- Any legacy SQL syntax or PostgreSQL 9.4 specific features (if any) are refactored to be compatible with PostgreSQL 15.
- The application connects to PostgreSQL 15 without raising "SCRAM authentication requires libpq version 10 or above" errors (this requires US-001 to be completed first).
- All automated tests pass against the PostgreSQL 15 database.

## US-003 Automatic DB preparation on startup

As a developer, I want the database to be prepared automatically on startup, so that I don't have to manually prepare it.

### Acceptance Criteria

- [ ] The app will automatically run migrations on startup even if the DB is completely empty
- [ ] The app will automatically load the postcode table on startup
- [ ] THe app will only take these actions if they are necessary (the postcode table is not loaded OR the migrations have not been run)
   