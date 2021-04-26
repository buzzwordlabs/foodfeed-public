--! Previous: sha1:e8b03ea4008465cf7b208f0e2b529b8270652367
--! Hash: sha1:154e91896c68d1e10a375e492351e7751828a6f0

--! no-transaction
CREATE UNIQUE INDEX CONCURRENTLY ON users_devices ("userId", "deviceId");
