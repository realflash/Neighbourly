# Design: Containerised Bounds Service

## 1. Repository Restructuring
**Standard Adhered To**: Epic Subdirectories Constraint
- **`frontend/`**: The entire existing `Neighbourly` Ruby app (Sinatra) will be moved into this directory, including its `Dockerfile`, `run_docker.sh`, `.env`, and all Ruby/HAML files.
- **`bounds_service/`**: A new directory will be created to house the `neighbourly-serverless` code.

## 2. Bounds Service Architecture (Node.js/Express)
**Standard Adhered To**: Endpoint Parity & Containerisation Constraint
- **Core Technology**: We will retain the Node.js implementation to preserve the complex PDF generation (`build-pdf.js`, `handler.js`).
- **Web Server Wrapper**: Since the code was written for AWS Lambda (`handler.js` exporting functions), we will introduce `express` to wrap the Lambda handlers in a standard HTTP server that listens on port `3000`.
- **Endpoints**:
  - `GET /territories/bounds` -> Maps to `module.exports.getForBounds`
  - `GET /map` -> Maps to `module.exports.generateMap`
  - The Express wrapper will translate HTTP Request parameters into the `event.queryStringParameters` object that the Lambda handler expects, and translate the Lambda `callback` into an Express `res.send()` or `res.json()`.
- **Database**: The service will use the `pg` client already present in the Node code, connecting via the `DATABASE_URL` environment variable.

## 3. Containerisation strategy
**Standard Adhered To**: Independent Operations
- **Frontend Container**: No change to the image logic, just moved to `frontend/`.
- **Bounds Service Container**:
  - Base Image: `node:18-alpine` (or similar).
  - Dependencies: `npm install express`.
  - Network: Uses `--network="host"` in `run_docker.sh` to allow seamless connection to the PostgreSQL database on `localhost:5432`.
- **Scripts**:
  - `bounds_service/build_container.sh`: Builds `neighbourly-bounds-service:local`.
  - `bounds_service/run_docker.sh`: Runs the container, passing `.env` variables (e.g. `DATABASE_URL`, `GOOGLE_MAPS_KEY`).

## 4. Configuration & Environment
**Standard Adhered To**: Independent Operations & Database Constraints
- **Database Connection**: `bounds_service/.env` will define `DATABASE_URL="postgres://user:password@localhost:5432/neighbourly_uk"` (same as UAT).
- **Frontend Integration**: `frontend/.env` will have `LAMBDA_BASE_URL="http://localhost:3000"` instead of the AWS API Gateway URL, seamlessly routing map requests to the new local container.
