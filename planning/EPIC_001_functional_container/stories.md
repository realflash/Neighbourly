# EPIC 1: Functional Container

## US-001: Build a functional container to run the app locally [IMPLEMENTED]

As a developer, I want to be able to run the app locally in a container, so that I can test the app and make changes to it. I want to minimise the changes necessary to the existing code to achieve this, so I want to run a container with software versions likely to be compatible with the existing application. 

## Acceptance Criteria

- The app can be run locally in a container
- The app can be accessed at http://localhost:4567
- The app can be stopped by running standard docker commands
- The app is entirely contained in one container
- The app can connect to the local postgres container instance exposed on localhost:5432
- The base container image is ideally distroless
- The age or version of the base container image is chosen to maximise the chances of existing software versions being compatible (e.g. ruby base images would be of an age likely to have targeted by this software when it was written)
- The file build_container.sh.example is used as a reference for how to make a build script, with the intended outcomes of those sections of the build used as guidance to arrive at the final build script. Obviously since this prodict is written in a different language to that of the app the example script targets, changes will need to be made accordingly.