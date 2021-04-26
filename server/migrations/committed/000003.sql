--! Previous: sha1:28d805071e66ce546272ffb6100f384488655af1
--! Hash: sha1:43e3c4a5e6101b43147692815bebca403f170849

--! split: 1-current.sql
-- Enter migration here
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE topics ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE call_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE stream_history ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE deleted_users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE faqs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE reported_users ALTER COLUMN id SET DEFAULT gen_random_uuid();

DROP EXTENSION IF EXISTS "uuid-ossp";
