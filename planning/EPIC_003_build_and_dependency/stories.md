# EPIC 3 - Build and Dependency Updates

## US-001: Upgrade third-party libraries to latest stable versions

As a developer, I want to update all third-party libraries and gem dependencies to their latest stable versions, so that the application benefits from recent bug fixes, security vulnerability patches, and modern features.

### Acceptance Criteria

- All outdated gems in `Gemfile` are bumped to their latest stable major versions.
- Any deprecated method calls, APIs, or configuration patterns introduced by the updated libraries are refactored to use the modern equivalents.
- Ensure that the application's core functionality (e.g., routing in Sinatra, ORM queries in Sequel) continues to work as expected after the upgrades.
- Any frontend third-party libraries (e.g., JavaScript libraries or CSS frameworks) are audited and updated to their latest stable releases if applicable.
- All automated tests and container builds pass successfully with the new dependency versions.

## US-002: Move to up-to-date build tools

As a developer, I want to migrate the application's build and deployment pipeline to modern tools, so that the build process is faster, more secure, and aligns with current industry best practices.

### Acceptance Criteria

- The legacy Debian Jessie base image is replaced with a modern, supported OS distribution (e.g., Debian Bookworm or Alpine) to eliminate deprecated apt sources and security vulnerabilities.
- The `Dockerfile` is refactored to utilize modern Docker features, such as multi-stage builds, to reduce the final image size and improve security.
- Any deprecated build scripts (e.g., relying on outdated bundler flags or legacy package managers) are updated.
- The Docker BuildKit engine is fully supported and enabled for all container builds, resolving any "legacy builder is deprecated" warnings currently seen in the pipeline.
- The CI/CD pipeline scripts (e.g., `build_container.sh`, `run_docker.sh`) are audited and updated to ensure compatibility with modern Bash and Docker CLI standards.

## US-003 Switch to distroless for final image

As a developer, I want the final container image to be distroless, so that it has a smaller attack surface and is more secure.

### Acceptance Criteria

- The final container image is distroless
- The container builds successfully
- The application runs successfully
