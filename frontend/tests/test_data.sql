-- Create schema for boundary data
CREATE SCHEMA IF NOT EXISTS admin_bdys_201702;

-- Create boundary table
CREATE TABLE IF NOT EXISTS admin_bdys_201702.abs_2011_mb (
    mb_11code VARCHAR(20) PRIMARY KEY,
    geom GEOMETRY(MultiPolygon, 4326),
    yes_quarantined VARCHAR(1) DEFAULT 'N',
    mb_category VARCHAR(50) DEFAULT 'RESIDENTIAL',
    avg_swing_propensity FLOAT DEFAULT 0.3,
    outcomes_recorded INTEGER DEFAULT 0,
    total_addresses_on_block INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.pcode_bounds (
    pcode text PRIMARY KEY,
    swlat double precision,
    swlng double precision,
    nelat double precision,
    nelng double precision
);

INSERT INTO public.pcode_bounds (pcode, swlat, swlng, nelat, nelng)
VALUES ('1234', 51.3, -0.7, 51.4, -0.6)
ON CONFLICT (pcode) DO NOTHING;

-- Insert a mock meshblock around the test coordinates
INSERT INTO admin_bdys_201702.abs_2011_mb (mb_11code, geom, mb_category, avg_swing_propensity, total_addresses_on_block)
VALUES ('E00180604', 
        ST_GeomFromText('MULTIPOLYGON(((-0.72 51.33, -0.63 51.33, -0.63 51.37, -0.72 51.37, -0.72 51.33)))', 4326),
        'RESIDENTIAL', 0.45, 10)
ON CONFLICT (mb_11code) DO NOTHING;

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    gnaf_pid VARCHAR(20) PRIMARY KEY,
    mb_2011_code VARCHAR(20),
    locality_name VARCHAR(100),
    postcode VARCHAR(10),
    street_name VARCHAR(100),
    number_first VARCHAR(20),
    elector_name VARCHAR(255),
    gender VARCHAR(10),
    age INTEGER,
    alias_principal VARCHAR(1)
);

-- Insert mock addresses
INSERT INTO public.addresses (gnaf_pid, mb_2011_code, locality_name, postcode, street_name, number_first, elector_name, gender, age, alias_principal)
VALUES ('G1', 'E00180604', 'Test Locality', 'GU24 9AA', 'Test Street', '1', 'John Doe', 'M', 30, 'P'),
       ('G2', 'E00180604', 'Test Locality', 'GU24 9AA', 'Test Street', '2', 'Jane Smith', 'F', 84, 'P')
ON CONFLICT (gnaf_pid) DO NOTHING;

-- Create test campaigns
INSERT INTO public.campaigns (id, name, status, campaign_type) 
VALUES (1, 'Test Campaign 1', 'active', 'leafleting'),
       (14, 'Test Campaign 14', 'active', 'leafleting'),
       (15, 'Test Campaign 15', 'active', 'canvassing')
ON CONFLICT (id) DO NOTHING;

-- Link Campaigns to CED 1 (Abbey ED, which is in ceds.sql)
INSERT INTO public.campaign_ceds (campaign_id, ced_id) 
VALUES (1, 1), (14, 1), (15, 1)
ON CONFLICT DO NOTHING;

-- Link CED 1 to Meshblock 'E00180604'
INSERT INTO public.ced_output_areas (ced_id, oa_code) 
VALUES (1, 'E00180604')
ON CONFLICT DO NOTHING;

-- Create an admin user
INSERT INTO public.users (email, first_name, last_name, role, created_at)
VALUES ('admin@example.com', 'Admin', 'User', 'admin', NOW())
ON CONFLICT (email) DO NOTHING;

-- Sync sequences for tables where we manually inserted IDs
SELECT setval('public.campaigns_id_seq', (SELECT MAX(id) FROM public.campaigns));
