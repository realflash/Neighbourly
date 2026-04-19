# Verified Design

## 1. Dockerfile Design
**Adheres to:** Container Constraints (Base Image Compatibility, Image Size/Security, Port Exposure)

- **Base Image:** We will use `ruby:2.3.3-slim`. A Debian-slim image provides the best balance between maximizing compatibility for native C extensions (like `pg`, `puma`, `sequel_pg`) which frequently fail to compile on `alpine` for old Ruby versions, and keeping the image size relatively small compared to the full `ruby:2.3.3` image. Using true `distroless` for an interpreted language like Ruby is extremely complex without a maintained upstream base, so `-slim` is the practical minimum.
- **Dependencies Stage:** We will install essential build tools (`build-essential`, `libpq-dev`) to compile the gems.
- **Port:** EXPOSE 4567.
- **Command:** `bundle exec puma -p 4567 -e development` (or `ruby app.rb`) as the entrypoint.

## 2. Docker Compose / Local Run Strategy
**Adheres to:** Container Constraints (Database Connection)

Since the user wants to test it connecting to `localhost:5432`, we will provide a `docker run` command utilizing host networking (`--network="host"`).
To satisfy US-002, the application (`app.rb`) will be modified to strictly require the `DB_URL` environment variable and remove any default connections. It will fail fast (using `abort`) if the variable is missing. 
The `run_docker.sh` script will be updated to source a `.env` file before executing `docker run` and explicitly pass `-e DB_URL`. A `.env.example` will be provided, and `.env` will be git-ignored.

## 3. Build Script (`build_container.sh`)
**Adheres to:** Build Script Constraints

We will create a bash script mimicking the provided `build_container.sh.example` template:
- **Linting:** We will skip this stage (mark as SKIPPED). `npm run lint` will not work because there is no `lint` script in `package.json`, and adding Node.js to the container just for a JS dev-dependency bloats the image. Furthermore, there is no Ruby linter (`rubocop`) configured, and adding one would require extensive code formatting changes, violating the minimal changes criteria.
- **Testing:** We will run `bundle exec rspec` to run the test suite.
- **Building:** We will execute `docker build -t neighbourly-app:local .`.
- **Scanning:** We will use `trivy image` (if available, or mock it) to scan the built container image.
