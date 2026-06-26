-- PostGIS powers indexed radius and zone queries.
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "Report"
ADD COLUMN "location" geography(Point, 4326)
GENERATED ALWAYS AS (
  ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
) STORED;

CREATE INDEX "Report_location_gix" ON "Report" USING GIST ("location");
