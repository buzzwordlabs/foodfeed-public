--! Previous: sha1:f7f8ae89bb37270434f2c05d6f43d5c72fdc6a0e
--! Hash: sha1:28d805071e66ce546272ffb6100f384488655af1

--! split: 1-current.sql
-- Enter migration here
ALTER TABLE deleted_users ALTER COLUMN gender DROP DEFAULT,
ALTER COLUMN gender TYPE users_gender_enum USING gender::text::users_gender_enum,
ALTER COLUMN gender SET DEFAULT 'U';

DROP TYPE deleted_users_gender_enum;
