--! Previous: sha1:43e3c4a5e6101b43147692815bebca403f170849
--! Hash: sha1:2e0fd7b5faf757cb835020ac93a7532d13b33360

--! split: 1-current.sql
-- Enter migration here
ALTER TABLE online_users ADD COLUMN "isWaiting" boolean;

ALTER TABLE online_users DROP COLUMN "peerConnectionOffer";
