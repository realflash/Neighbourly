# Implementation Plan

## Phase 1: Dockerfile Creation
1. Create a `Dockerfile` in the root of the repository.
2. Use `FROM ruby:2.3.3-slim`.
3. Install necessary OS packages for compiling gems and using PostgreSQL client: `apt-get update && apt-get install -y build-essential libpq-dev nodejs`. (NodeJS is needed for the ExecJS runtime if required by any gems, though `eslint` indicates some JS tooling).
4. Create a working directory `/app`.
5. Copy `Gemfile` and `Gemfile.lock`.
6. Install older bundler (`gem install bundler -v 1.15.3`) and run `bundle install`.
7. Copy the rest of the application code.
8. Expose port `4567`.
9. Set default command: `CMD ["bundle", "exec", "puma", "-p", "4567"]`.

## Phase 2: Create `.dockerignore`
1. Create a `.dockerignore` file.
2. Ignore `.git`, `spec`, `tmp`, `log`, `README.md`, etc., to keep the image minimal.

## Phase 3: Create Build Script
1. Create `build_container.sh` in the root.
2. Adapt `build_container.sh.example`'s staged approach.
3. Define stages for:
   - Linting (Skip)
   - Testing (`bundle exec rspec`)
   - Container Build (`docker build -t neighbourly-app:local .`)
4. Ensure script uses colors, captures exit codes, and prints a summary block at the end.
5. Make the script executable.

## Phase 4: Create Run Instructions
1. Document the command required to run the container and connect it to `localhost:5432`.
2. E.g., `docker run --rm -it -p 4567:4567 --network="host" -e DATABASE_URL="postgres://postgres:password@localhost:5432/neighbourly" neighbourly-app:local`. (Or appropriate `host.docker.internal` syntax depending on Docker desktop).
