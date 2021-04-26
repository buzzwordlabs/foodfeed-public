--! Previous: sha1:86e42e8726c22e4254e418f0dfeeb39871752f5b
--! Hash: sha1:e8b03ea4008465cf7b208f0e2b529b8270652367

-- Enter migration here
ALTER TABLE users_devices DROP CONSTRAINT users_devices_pkey;

ALTER TABLE users_devices ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
