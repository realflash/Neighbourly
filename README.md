# Neighbourly

## Background notes

- This repository contains all the code and instructions you need to run your own version of the Neighbourly doorknocking tool

### Australia 

- To run your own version of the Neighbourly backend infrastructure you can follow the instructions available in [this google doc](https://docs.google.com/document/d/1Amn246ERnAL_LTfBhCIZpRyTPwwtUYUeD2u90qPPl0c/edit).
    - Those instructions outline all steps required to create the full Neighbourly backend using Amazon Web Services (AWS).
    - The google doc explains how to deploy the code and other files in this repository, which includes all necessary deployment scripts and Lambda functions: https://github.com/TheCommonsLibrary/neighbourly-serverless.

### United Kingdom

- Adapted to run as a pair of docker containers. Follow the instructions below. 

### Run the app locally

### UK only prep

If you are setting up the UK version, you must import the geographical boundaries and electoral address data into your database before using the app.

1. Load the geographic boundaries using the `load_boundaries.sh` script. This requires the ONS Output Area shapefile and your database URL:
    ```bash
    ./frontend/etl/load_boundaries.sh path/to/shapefile.shp "postgres://localhost/neighbourly"
    ```

2. Transform and import the electoral address data using the `transform_addresses.rb` script. This requires your sanitised electoral CSV and the ONS UPRN Directory (OUPRD) CSV. Run the script and pipe its output directly into `psql`:
    ```bash
    ./frontend/etl/transform_addresses.rb path/to/sanitised_electoral.csv path/to/ouprd.csv | psql "postgres://localhost/neighbourly"
    ```
3. Download the CSV at https://www.data.gov.uk/dataset/36cf66a7-d570-4ee6-8ea0-f2e241d8b536/ons-postcode-directory-february-2026-for-the-uk-hosted-table or a later version and put it in the frontend/etl folder
3. Import the UK postcode boundaries data by running the following command:
    ```bash
    psql "postgres://localhost/neighbourly" < pcode_bounds_uk.sql
    ```

### Both countries


1. Download the code in this repository (click the "Clone or download" button above, then select "Download ZIP"). Once your download completes, unzip the folder.

2. Open the “Terminal” application on your Mac (or the equivalent application for your Operating System) and navigate to your new Neighbourly folder on the command line by following this instruction:
    - Type `cd`, press the spacebar, then drag and drop the Neighbourly folder onto the command line (like [this example](https://s3-ap-southeast-2.amazonaws.com/neighbourly-data/change-directory-command-line.gif)). It should result in output something like this: `cd /Users/JoeBloggs/Desktop/Neighbourly`

3. Install all project dependencies with the following commands:
    ```
    gem install bundler -v 1.15.3
    bundle install
    ```

4. Create the database by running the following commands:
    ```
    psql
    CREATE DATABASE neighbourly ENCODING 'UTF_8';
    CREATE DATABASE neighbourly_test ENCODING 'UTF_8';
    \q
    ```

5. Run the database migrations with the following commands:
    ```
    DATABASE_URL="postgres://localhost/neighbourly" rake db:migrate
    psql neighbourly < pcode_table.sql
    ```
    *Note: When deploying the UK version of this app, you must use the `postgis/postgis` image for your PostgreSQL database to support the necessary geographical extensions.*

6. Configure the Environment Variables for Both Services:
    The application is split into two microservices, each running in their own container. You must configure environment variables for both:

    **Frontend App**:
    - Copy the `.env.example` file located in the root directory to `frontend/.env` and customize the variables.
    - Set the `DB_URL` to point to your local database (e.g., `postgres://localhost/neighbourly`).
    - Point the `LAMBDA_BASE_URL` to your local bounds service (e.g., `http://localhost:3000`).

    **Bounds Service**:
    - Create a `.env` file inside the `bounds_service/` directory. It requires the following keys:
      ```env
      DATABASE_URL="postgres://user:password@localhost:5432/neighbourly_uk"
      GOOGLE_MAPS_KEY="your_google_maps_key_here"
      COUNTRY="UK" # or "AU"
      ```
      *Note: The bounds service will crash on startup if `GOOGLE_MAPS_KEY` is missing. For local testing without a real key, you can set it to `GOOGLE_MAPS_KEY="dummy"` to trigger a fallback image.*

7. Start the application using Docker:
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
