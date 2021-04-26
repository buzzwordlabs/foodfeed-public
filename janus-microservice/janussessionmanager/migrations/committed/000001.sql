--! Previous: -
--! Hash: sha1:ea47ec5e7a215ea7e0c21cddcb387c887e78b18d

-- Enter migration here
CREATE TABLE "sessions" (
    "deviceId" TEXT NOT NULL PRIMARY KEY,
    "isStreaming" boolean NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON "sessions"
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE INDEX ON "sessions" ("isStreaming");
