# Neighbourly

## Background notes

- This repository contains all the code and instructions you need to run your own version of the Neighbourly doorknocking tool

### Australia 

- To run your own version of the Neighbourly backend infrastructure you can follow the instructions available in [this google doc](https://docs.google.com/document/d/1Amn246ERnAL_LTfBhCIZpRyTPwwtUYUeD2u90qPPl0c/edit).
    - Those instructions outline all steps required to create the full Neighbourly backend using Amazon Web Services (AWS).
    - For UK deployments or local-first setups, you can package the spatial logic from [neighbourly-serverless](https://github.com/TheCommonsLibrary/neighbourly-serverless) into a Docker container. Deploy it as an internal Node.js API pod in your Kubernetes cluster alongside this application.
    - Set the `LAMBDA_BASE_URL` in this app's environment to point to that internal Kubernetes Service (e.g., `http://spatial-api-service:3000/prod`).

### United Kingdom

- Adapted to run as a pair of docker containers. Follow the instructions below. 

### Run the app locally

### Both countries - DB creation

4. Start a Dockerized PostGIS database (required for geographical extensions) using `trust` authentication for local development compatibility:
    *(Note: If you have a local PostgreSQL service running on port 5432, you must stop it first using `sudo systemctl stop postgresql`)*
    ```bash
    docker run --name neighbourly-db -e POSTGRES_PASSWORD=neighbourly -e POSTGRES_DB=neighbourly -e POSTGRES_USER=neighbourly -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 -d postgis/postgis:13-3.1
    ```

5. Run the database migrations using the frontend Docker container. First, build the container, then run the migration:
    ```bash
    cd frontend
    ./build_container.sh
    docker run --rm --network="host" -e DATABASE_URL="postgres://neighbourly:neighbourly@localhost/neighbourly" neighbourly-app:local bundle exec rake db:migrate
    cd ..
    docker exec -i neighbourly-db psql -U neighbourly -d neighbourly < pcode_bounds_au.sql  # Use pcode_bounds_uk.sql for UK deployments
    ```
    *Note: When deploying the UK version of this app, you must use the `postgis/postgis` image for your PostgreSQL database to support the necessary geographical extensions.*

### UK only

#### Install pre-requisites

If you are setting up the UK version, you must import the geographical boundaries and electoral address data into your database before using the app.

1. `sudo apt-get install ruby gdal-bin postgresql-client`

#### Load the Output Area boundary data
This data tells the app what the electoral boundaries of the UK are. (in manageable equal numbers of houses). 

1. Download the Shapefile zip from https://www.data.gov.uk/dataset/4d4e021d-fe98-4a0e-88e2-3ead84538537/output-areas-december-2021-boundaries-ew-bgc-v21 and extract it into the `frontend/etl` folder.
1. Load the geographic boundaries using the `load_boundaries.sh` script. This requires the ONS Output Area shapefile and your database URL:
    ```bash
    ./frontend/etl/load_boundaries.sh path/to/shapefile.shp "postgres://neighbourly:neighbourly@localhost/neighbourly"
    ```

#### Load the postcode boundaries
This data tells the app what the boundary of each postcode in the UK are, so that you can search for postcodes on the map.

3. Download the CSV at https://www.data.gov.uk/dataset/36cf66a7-d570-4ee6-8ea0-f2e241d8b536/ons-postcode-directory-february-2026-for-the-uk-hosted-table or a later version and put it in the `frontend/etl` folder.
4. Generate the postcode boundary SQL file using the downloaded ONSPD CSV:
    ```bash
    ./frontend/etl/generate_postcode_bounds.rb frontend/etl/ONSPD_FEB_2026_UK.csv > pcode_bounds_uk.sql
    ```
5. Import the UK postcode boundaries data by running the following command:
    ```bash
    docker exec -i neighbourly-db psql -U neighbourly -d neighbourly < pcode_bounds_uk.sql
    ```

#### Load your target area 
This data tells the app which Output Area each address belongs to. Rather than load every address in the UK, we only load the addresses for the areas that we are interested in - ie the scope of your campaign. Thus you will need an unredacted copy of the electoral roll for your area, adjusted for the format this ETL script expects, which isn't exactly the standard format. Only a candidate in an election can request this data.

1. Download the ONS UPRN data at https://geoportal.statistics.gov.uk/datasets/9beb2361978146f8ac85da18d21ee266/about and extract it into the `frontend/etl` folder.

2. Transform and import the electoral address data using the `transform_addresses.rb` script. This requires your sanitised electoral CSV and the ONS UPRN Directory (OUPRD) CSV. Run the script and pipe its output directly into `psql`:
    ```bash
    ./frontend/etl/transform_addresses.rb path/to/sanitised_electoral.csv path/to/ouprd.csv | PGPASSWORD=neighbourly psql -h localhost -U neighbourly -d neighbourly
    ```

### Both countries

1. Configure the Environment Variables for Both Services:
    The application is split into two microservices, each running in their own container. You must configure environment variables for both:

    **Frontend App**:
    - Copy the `.env.example` file located in the root directory to `frontend/.env` and customize the variables.
    - Set the `DB_URL` to point to your local database (e.g., `postgres://neighbourly:neighbourly@localhost/neighbourly`).
    - Point the `LAMBDA_BASE_URL` to your local bounds service (e.g., `http://localhost:3000`).

    **Bounds Service**:
    - Create a `.env` file inside the `bounds_service/` directory. It requires the following keys:
      ```env
      DATABASE_URL="postgres://neighbourly:neighbourly@localhost:5432/neighbourly"
      GOOGLE_MAPS_KEY="your_google_maps_key_here"
      COUNTRY="UK" # or "AU"
      ```
      *Note: The bounds service will crash on startup if `GOOGLE_MAPS_KEY` is missing. For local testing without a real key, you can set it to `GOOGLE_MAPS_KEY="dummy"` to trigger a fallback image.*

3. Start the application using Docker:
    Instead of running the application manually, you should build and run both containers using the provided scripts.

    **Start the Bounds Service**:
    ```bash
    cd bounds_service
    ./build_container.sh
    ./run_docker.sh
    cd ..
    ```

    **Start the Frontend App**:
    ```bash
    cd frontend
    ./build_container.sh
    ./run_docker.sh
    ```
    
    The frontend will be accessible at `http://localhost:4567` and the bounds service at `http://localhost:3000`.

### Updating the design to suit your organisation

1. Inside the `public/images` folder, replace the `home-background.jpg` with a photo of your choice. This is the image used on the main login screen.

2. Inside the `public/images` folder, replace the `home-logo.png` with the logo you would like to appear in the top-left of the main login screen.
    - Ideally you should use the inverse version of your logo (e.g. white, with a transparent background), given this logo appears on top of a photo.
    - A square version of your logo will work well. For reference, the current example logo has a 5:4 aspect ratio.

3. Inside the `public/images` folder, replace the `map-logo.png` with your primary logo to appear in the top-left of the main map screen.
    - A square version of your logo will work well. For reference, the current example logo has a 5:4 aspect ratio.

4. Update the `favicon.ico` image inside the `public` folder.
