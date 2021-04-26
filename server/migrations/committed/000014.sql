--! Previous: sha1:3360842a3883f6b9c1b061bf0e490ff64d9e5baf
--! Hash: sha1:b1094d047b2125a4546cc4e4ea936afccc28607a

-- Enter migration here
ALTER TABLE users_devices ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE users_stream_reactions ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE users_stream_viewers ALTER COLUMN "viewerId" DROP NOT NULL;
