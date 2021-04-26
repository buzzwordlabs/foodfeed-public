--! Previous: sha1:0e686602ae4cba3eac231e786ad5bb7c054d33ab
--! Hash: sha1:3a5bcc62bef94cdd5159667de33be6a49faee5bd

--! no-transaction
CREATE INDEX CONCURRENTLY ON users_live_streams_viewers ("userId", "streamId");
