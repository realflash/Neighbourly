# EPIC 003: Bounds service

## US-001: Containerise lambda service

As a developer I want the code for the lambda bounds service to run in a container. It should use the same postgis data from the uat container and expose the same endpoints as the current lambda service.

### Acceptance Criteria

- [ ] The code for the lambda bounds service runs in a container.
- [ ] The container uses the same postgis data as the uat container.
- [ ] The container exposes the same endpoints as the current lambda service.