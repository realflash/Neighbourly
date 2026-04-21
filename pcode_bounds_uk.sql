--Post migration run "heroku pg:psql < pcode_bounds_uk.sql" or similar to import

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

SET search_path = public, pg_catalog;

SET default_tablespace = '';
SET default_with_oids = false;

--
-- Name: pcode_bounds; Type: TABLE; Schema: public; Owner: volunteer
--
-- We use varying(10) instead of varying(4) to accommodate UK postcodes.

DROP TABLE IF EXISTS pcode_bounds;
CREATE TABLE pcode_bounds (
    pcode character varying(10),
    swlat double precision,
    swlng double precision,
    nelat double precision,
    nelng double precision
);

--
-- Data for Name: pcode_bounds; Type: TABLE DATA; Schema: public; Owner: volunteer
--

COPY pcode_bounds (pcode, swlat, swlng, nelat, nelng) FROM stdin;
GU18 5SW	51.34	-0.66	51.36	-0.64
\.
