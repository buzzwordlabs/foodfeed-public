--! Previous: sha1:2e0fd7b5faf757cb835020ac93a7532d13b33360
--! Hash: sha1:d95573e1a49192633624dbe4e6984018bc6c4f29

--! no-transaction
CREATE INDEX CONCURRENTLY ON online_users ("isWaiting");
