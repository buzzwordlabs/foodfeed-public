--! Previous: sha1:65fa73ff13df6ef777ea02087a3b4e7c958b9aff
--! Hash: sha1:b4b14b5f9621d4a3f04456ea66c62443acfc8e9b

--! no-transaction
CREATE INDEX CONCURRENTLY "users_fullName_trgm_idx" ON users USING gin ("fullName" gin_trgm_ops);
