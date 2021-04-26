--! Previous: sha1:b1094d047b2125a4546cc4e4ea936afccc28607a
--! Hash: sha1:d9559851a6cd5c13017ab951f697826a121cc915

-- Enter migration here

ALTER TABLE blocked_users RENAME TO users_blocklist;

ALTER TABLE users_blocklist RENAME CONSTRAINT "blocked_users_pkey" TO "users_blocklist_pkey";

ALTER TABLE users_blocklist RENAME CONSTRAINT "blocked_users_blockedId_fkey" TO "users_blocklist_blockedId_fkey";

ALTER TABLE users_blocklist RENAME CONSTRAINT "blocked_users_userId_fkey" TO "users_blocklist_userId_fkey";

CREATE OR REPLACE FUNCTION trigger_remove_follow_relationship_when_blocked()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM users_followers WHERE ("userId"=new."userId" AND "followerId"=new."blockedId") OR ("userId"=new."blockedId" AND "followerId"=new."userId");
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER remove_follow_relationship_when_blocked
AFTER INSERT ON users_blocklist
FOR EACH ROW
EXECUTE PROCEDURE trigger_remove_follow_relationship_when_blocked();

CREATE TABLE IF NOT EXISTS "users_posts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "description" TEXT,
    "edited" boolean DEFAULT false,
    "banned" boolean NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON "users_posts" ("createdAt");

CREATE INDEX ON "users_posts" ("banned");

CREATE TABLE IF NOT EXISTS "users_posts_reactions" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE,
    "reaction" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("userId", "postId", "reaction")
);

CREATE TYPE "users_posts_media_enum" AS ENUM('image', 'video');

CREATE TABLE IF NOT EXISTS "users_posts_media" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE,
  "type" users_posts_media_enum NOT NULL,
  "position" integer NOT NULL,
  "uri" TEXT NOT NULL,
  CONSTRAINT max_media_items_check CHECK (position BETWEEN 0 AND 6)
);

CREATE INDEX ON "users_posts_media" ("postId");

CREATE TABLE IF NOT EXISTS "users_posts_reactions_total" (
    "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE,
    "reaction" TEXT NOT NULL,
    "count" integer NOT NULL,
    PRIMARY KEY ("postId", "reaction"),
    CONSTRAINT count_is_positive_check CHECK (count >= 0)
);

CREATE OR REPLACE FUNCTION trigger_update_post_reactions_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users_posts_reactions_total ("postId", "reaction", "count") VALUES (new."postId", new."reaction", 1)
    ON CONFLICT ON CONSTRAINT users_posts_reactions_total_pkey
    DO UPDATE SET count=users_posts_reactions_total.count + 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users_posts_reactions_total SET count=count-1 WHERE "postId"=old."postId" AND reaction=old.reaction RETURNING count INTO current_count;
    IF (current_count = 0 AND old.reaction <> 'like') THEN
        DELETE FROM users_posts_reactions_total WHERE "postId"=old."postId" AND reaction=old.reaction;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trigger_initial_post_reactions_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users_posts_reactions_total ("postId", "reaction", "count") VALUES (new.id, 'like', 0);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users_posts
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TRIGGER initial_post_reactions_count
AFTER INSERT ON users_posts
FOR EACH ROW
EXECUTE PROCEDURE trigger_initial_post_reactions_count();

CREATE TRIGGER update_post_reactions_count
AFTER INSERT OR DELETE ON users_posts_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_post_reactions_count();

ALTER TABLE users ADD COLUMN "bio" TEXT;

CREATE TYPE "users_reported_enum" AS ENUM('streamer-reports-viewer', 'viewer-reports-streamer','post', 'call', 'user');

ALTER TABLE reported_users ADD COLUMN "type" users_reported_enum;

ALTER TABLE reported_users ADD COLUMN metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE reported_users ADD COLUMN reviewed boolean NOT NULL DEFAULT false;

CREATE TYPE "users_devices_platform_enum" AS ENUM('android', 'ios');

ALTER TABLE users_devices ALTER COLUMN "platform" TYPE users_devices_platform_enum USING platform::text::users_devices_platform_enum;

CREATE TYPE "call_rating_enum" AS ENUM('good', 'bad');

ALTER TABLE call_history ALTER COLUMN "callerRating" TYPE call_rating_enum USING "callerRating"::text::call_rating_enum;

ALTER TABLE call_history ALTER COLUMN "calleeRating" TYPE call_rating_enum USING "calleeRating"::text::call_rating_enum;

ALTER TABLE users ALTER "resetPasswordExpires" TYPE TIMESTAMPTZ USING "resetPasswordExpires" AT TIME ZONE 'UTC';

ALTER TABLE users_followers ADD CONSTRAINT "userId_not_equal_followerId_check" CHECK ("userId" <> "followerId");

ALTER TABLE users_blocklist ADD CONSTRAINT "userId_not_equal_blockedId_check" CHECK ("userId" <> "blockedId");

ALTER TABLE stream_history ADD COLUMN "uri" TEXT;

ALTER TABLE topics ALTER COLUMN "name" TYPE text;
ALTER TABLE topics ALTER COLUMN "description" TYPE text;
ALTER TABLE users ALTER COLUMN "firstName" TYPE text;
ALTER TABLE users ALTER COLUMN "lastName" TYPE text;
ALTER TABLE users ALTER COLUMN "username" TYPE text;
ALTER TABLE users ALTER COLUMN "email" TYPE text;
ALTER TABLE users ALTER COLUMN "password" TYPE text;
ALTER TABLE users ALTER COLUMN "avatar" TYPE text;
ALTER TABLE call_history ALTER COLUMN "callerDeviceId" TYPE text;
ALTER TABLE call_history ALTER COLUMN "callerDescription" TYPE text;
ALTER TABLE call_history ALTER COLUMN "calleeDeviceId" TYPE text;
ALTER TABLE call_history ALTER COLUMN "calleeDescription" TYPE text;
ALTER TABLE stream_history ALTER COLUMN "deviceId" TYPE text;
ALTER TABLE stream_history ALTER COLUMN "title" TYPE text;
ALTER TABLE stream_history ALTER COLUMN "thumbnail" TYPE text;
ALTER TABLE deleted_users ALTER COLUMN "reason" TYPE text;
ALTER TABLE faqs ALTER COLUMN "question" TYPE text;
ALTER TABLE faqs ALTER COLUMN "answer" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "deviceId" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "appVersion" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "codePushVersion" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "systemModel" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "systemVersion" TYPE text;
ALTER TABLE users_devices ALTER COLUMN "notificationToken" TYPE text;
ALTER TABLE online_users ALTER COLUMN "deviceId" TYPE text;
ALTER TABLE online_users ALTER COLUMN "socketId" TYPE text;
ALTER TABLE online_users ALTER COLUMN "streamTitle" TYPE text;
ALTER TABLE online_users ALTER COLUMN "thumbnail" TYPE text;
ALTER TABLE online_users ALTER COLUMN "activeConnection" TYPE text;
ALTER TABLE reported_users ALTER COLUMN "reason" TYPE text;
