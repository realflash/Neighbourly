# EPIC 1: Functional Container

## US-001: Build a functional container to run the app locally [IMPLEMENTED]

As a developer, I want to be able to run the app locally in a container, so that I can test the app and make changes to it. I want to minimise the changes necessary to the existing code to achieve this, so I want to run a container with software versions likely to be compatible with the existing application. 

## Acceptance Criteria

- [x] The app can be run locally in a container
- [x] The app can be accessed at http://localhost:4567
- [x] The app can be stopped by running standard docker commands
- [x] The app is entirely contained in one container
- [ ] The app can connect to the local postgres container instance exposed on localhost:5432
- [ ] The base container image is ideally distroless
- [x] The age or version of the base container image is chosen to maximise the chances of existing software versions being compatible (e.g. ruby base images would be of an age likely to have targeted by this software when it was written)
- [x] The file build_container.sh.example is used as a reference for how to make a build script, with the intended outcomes of those sections of the build used as guidance to arrive at the final build script. Obviously since this prodict is written in a different language to that of the app the example script targets, changes will need to be made accordingly.

## US-002: Force connection to DB [IMPLEMENTED]

As a developer, I want the app to check that it has a valid DB connection, and fail fast if it does not.

## Acceptance Criteria

- The app will check for a valid DB connection on startup in the environment variable DB_URL
- The app will fail fast if it does not have a valid DB_URL env var
- The app will not have a default value for DB_URL
- The run_docker.sh script will source the file .env at the start of the script and pass the DB_URL to the container
- .env will be added to .gitignore
- .env.example will included a dummy DB_URL value to indicate the required environment variable and format