# Epic Standards: Bounds Service

## Relevant Domains
1. **Infrastructure & Architecture**: Containerisation, API exposure, independent versioning, deployment scripts.
2. **Codebase Organisation**: Mono-repo structure (`frontend/` and `bounds_service/`).

## Architectural Constraints
- **ADR-0015: Repository Structure & Testing Hierarchy**: Although ADRs suggest Python FastAPI for *new* backend services, this Epic explicitly focuses on *containerising* the existing lambda bounds service code. Due to the complexity of the existing `pdfkit` logic, we will retain the Node.js implementation but wrap it in an Express/Fastify container to expose the endpoints locally, rather than executing a full rewrite. (If a rewrite to Python FastAPI is required to strictly adhere to ADR-0004, this must be explicitly requested, but containerisation of existing assets is the stated scope).
- **Subdirectories**: The root repository will be split. 
  - `frontend/`: Current Sinatra app and UI assets.
  - `bounds_service/`: The containerised bounds service (migrated from `neighbourly-serverless`).
- **Independent Operations**: Each service must have its own:
  - `Dockerfile`
  - `build_container.sh`
  - `run_docker.sh`
  - `.env` file
  - Versioning (e.g. `VERSION` file).

## Database Constraints
- **ADR-0008: Use PostgreSQL for Primary DB**: The new container must connect to the existing PostGIS database (same as the UAT container) rather than relying on its own separate datastore.

## API Constraints
- **Endpoint Parity**: The `bounds_service` container must expose:
  - `GET /territories/bounds`
  - `GET /map`
  These endpoints must accept the identical query parameters and return the identical JSON/Base64 responses as the current AWS Lambda implementation to ensure the frontend operates without modification.
