--! Previous: sha1:5ce589461e01529c078972b4eb0fa29f92237c08
--! Hash: sha1:e034ea3b9f59714b2a1de57c21b27c02273ebaf1

--! no-transaction
CREATE UNIQUE INDEX CONCURRENTLY ON users_stream_reactions ("userId", "streamId");
