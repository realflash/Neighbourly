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
1. Update `run_docker.sh` to source `.env` if it exists.
2. Ensure it runs the container with `--network="host"` and passes `-e DB_URL="$DB_URL"`.
3. Add `.env` to `.gitignore`.
4. Update `.env.example` to include a dummy `DB_URL`.

## Phase 5: App DB Logic Updates
1. Modify `app.rb` to fail fast (`abort`) if `ENV['DB_URL']` is missing or empty.
2. Remove any fallback connection strings (`postgres://localhost/...`) from `app.rb` so it strictly relies on `DB_URL`.
