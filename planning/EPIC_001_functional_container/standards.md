# EPIC-001 Standards

These are the inviolable rules extracted from the epic's stories and the local repository configuration for building a functional container.

## Container Constraints
- **Base Image Compatibility**: The base image must support Ruby 2.3.3 natively, as updating the application to a newer Ruby version is out of scope.
- **Image Size/Security**: The final container image should ideally be distroless, or as minimal as possible (e.g., using `alpine` variants) to reduce attack surface and size.
- **Port Exposure**: The container must expose port `4567` for local development access.
- **Database Connection**: The container must be able to connect to a local PostgreSQL instance exposed on `localhost:5432` (typically using host networking or `host.docker.internal` in Docker Desktop/similar setups).
- **Self-Contained**: The application and its runtime dependencies must be entirely contained within a single Docker image.

## Build Script Constraints
The project must include a `build_container.sh` script modelled after `build_container.sh.example`. It must implement a stage-based execution flow with at least the following applicable stages for this Ruby app:
- Dependencies (`bundle install`)
- Linting (`eslint` or `rubocop` if present)
- Testing (`rspec`)
- Building (Container)
- Container Security (e.g., `trivy` or similar container scan)

The script must report `PASS`/`FAIL`/`SKIPPED` for each stage.
