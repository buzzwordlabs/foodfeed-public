--! Previous: sha1:d95573e1a49192633624dbe4e6984018bc6c4f29
--! Hash: sha1:5f2688d26c913aa630da523eff42d903e1949a76

ALTER TABLE online_users ADD COLUMN "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON online_users
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();
