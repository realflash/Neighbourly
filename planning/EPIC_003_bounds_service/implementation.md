# Implementation Plan: Containerised Bounds Service

## Phase 1: Repository Restructuring
1. **Create Subdirectories**: Create `frontend/` and `bounds_service/` directories in the root repository.
2. **Migrate Frontend**: Move all current `Neighbourly` Ruby/Sinatra assets (e.g. `app.rb`, `views/`, `public/`, `Dockerfile`, `run_docker.sh`, `.env`, `spec/`, etc.) into `frontend/`.
3. **Migrate Bounds Service**: Copy the contents of `../neighbourly-serverless/` into the `bounds_service/` directory.

## Phase 2: Express Wrapper for Bounds Service
1. **Initialize App**: Run `npm init -y` or update `package.json` in `bounds_service/` to include `express`.
2. **Create Server File**: Add `server.js` to `bounds_service/`:
   - Initialize an Express app on port `3000`.
   - Require `handler.js`.
   - Create route `GET /territories/bounds` that parses `req.query`, builds the Lambda `event` object, and passes it to `handler.getForBounds`.
   - Create route `GET /map` that passes `req.query` to `handler.generateMap`.
   - Ensure the Express response directly streams or returns the JSON/Base64 payloads based on the lambda `callback(err, response)`.

## Phase 3: Containerisation of Bounds Service
1. **Dockerfile**: Create `bounds_service/Dockerfile` using `node:18-alpine` (or an appropriate Node image matching the current lambda environment).
   - Set `WORKDIR /app`.
   - Copy `package.json` and install dependencies.
   - Copy source code (`handler.js`, `build-pdf.js`, `server.js`, assets).
   - Expose port `3000`.
   - Set CMD to `node server.js`.
2. **Scripts**:
   - Create `bounds_service/build_container.sh`.
   - Create `bounds_service/run_docker.sh` (using `--network="host"` and correctly exporting `.env` variables like `DATABASE_URL` and `GOOGLE_MAPS_KEY`).
3. **Configuration**: Create `bounds_service/.env` with local Postgres URI.
4. **Versioning**: Create `bounds_service/VERSION` initialized to `1.0.0`.

## Phase 4: Frontend Integration & Validation
1. **Update Frontend Config**: Modify `frontend/.env` to set `LAMBDA_BASE_URL="http://localhost:3000"`.
2. **End-to-End Test Configuration**: Ensure both containers are spun up during the end-to-end testing phase (or instruct the user to run both `run_docker.sh` scripts).
