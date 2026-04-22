# EPIC 003: Bounds service

## US-001: Containerise lambda service [IMPLEMENTED]
Implemented Node.js/Express service container running the legacy lambda handlers, segregated repository into `frontend/` and `bounds_service/` directories with independent configurations, and validated HTTP connectivity using `--network=host` against the local PostGIS container.

As a developer I want the code for the lambda bounds service to run in a container. It should use the same postgis data from the uat container and expose the same endpoints as the current lambda service.

### Acceptance Criteria

- [x] The code for the lambda bounds service runs in a container.
- [x] The container uses the same postgis data as the uat container.
- [x] The container exposes the same endpoints as the current lambda service.
- [x] All assets for the frontend service are in a subdirectory of the repository, and the assets for the bounds service are in a separate subdirectory. Each have their own build scripts and run_docker scripts. Each have their own .env files. Each are versioned independently. 