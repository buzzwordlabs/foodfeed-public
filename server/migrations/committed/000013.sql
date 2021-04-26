--! Previous: sha1:b1d37c0961d7b074aa8fa79320fb1ef2df9b694c
--! Hash: sha1:3360842a3883f6b9c1b061bf0e490ff64d9e5baf

--! no-transaction
CREATE UNIQUE INDEX CONCURRENTLY ON users_stream_viewers ("viewerId", "streamId");
