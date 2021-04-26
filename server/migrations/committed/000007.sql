--! Previous: sha1:5f2688d26c913aa630da523eff42d903e1949a76
--! Hash: sha1:86e42e8726c22e4254e418f0dfeeb39871752f5b

--! no-transaction
CREATE INDEX CONCURRENTLY ON online_users ("updatedAt");
