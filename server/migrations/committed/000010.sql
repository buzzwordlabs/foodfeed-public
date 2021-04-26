--! Previous: sha1:154e91896c68d1e10a375e492351e7751828a6f0
--! Hash: sha1:5ce589461e01529c078972b4eb0fa29f92237c08

-- Enter migration here
ALTER TABLE users_stream_reactions DROP CONSTRAINT users_stream_reactions_pkey;

ALTER TABLE users_stream_reactions ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
