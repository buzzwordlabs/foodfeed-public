--! Previous: sha1:22cb4da6929702c2e0da651f593da96ff1934817
--! Hash: sha1:65fa73ff13df6ef777ea02087a3b4e7c958b9aff

--! no-transaction
CREATE INDEX CONCURRENTLY users_username_trgm_idx ON users USING gin (username gin_trgm_ops);
