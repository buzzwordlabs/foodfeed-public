--! Previous: sha1:e034ea3b9f59714b2a1de57c21b27c02273ebaf1
--! Hash: sha1:b1d37c0961d7b074aa8fa79320fb1ef2df9b694c

-- Enter migration here
ALTER TABLE users_stream_viewers DROP CONSTRAINT users_stream_viewers_pkey;

ALTER TABLE users_stream_viewers ADD COLUMN id uuid DEFAULT gen_random_uuid() PRIMARY KEY;
