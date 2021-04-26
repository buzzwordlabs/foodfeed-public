--! Previous: sha1:2931f4cc37f21a2ccdbc17eadd1435b3a3707d6f
--! Hash: sha1:22cb4da6929702c2e0da651f593da96ff1934817

ALTER TABLE users_stream_viewers RENAME TO users_live_streams_viewers;

ALTER TABLE users_live_streams_viewers RENAME "viewerId" TO "userId";

ALTER TABLE users_live_streams_viewers
DROP CONSTRAINT "users_stream_viewers_viewerId_fkey",
ADD CONSTRAINT "users_live_streams_viewers_userId_fkey"
   FOREIGN KEY ("userId")
   REFERENCES users
   ON DELETE CASCADE;

ALTER TABLE users_live_streams_viewers RENAME CONSTRAINT "users_stream_viewers_streamId_fkey" TO "users_live_streams_viewers_streamId_fkey";

CREATE OR REPLACE FUNCTION trigger_update_view_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_NAME = 'update_live_view_count') THEN
        IF NOT EXISTS (SELECT 1 FROM users_live_streams_viewers WHERE "userId"=new."userId" AND "streamId"=new."streamId" LIMIT 1) THEN
            UPDATE stream_history SET "liveViews"="liveViews"+1 WHERE id=new."streamId";
            RETURN NEW;
        ELSE
            RETURN NEW;
        END IF;
    ELSIF (TG_NAME = 'update_recorded_view_count') THEN
        IF NOT EXISTS (SELECT 1 FROM users_recorded_streams_viewers WHERE "userId"=new."userId" AND "streamId"=new."streamId" LIMIT 1) THEN
            UPDATE stream_history SET "recordedViews"="recordedViews"+1 WHERE id=new."streamId";
            RETURN NEW;
        ELSE
            RETURN NEW;
        END IF;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_live_view_count
BEFORE INSERT ON users_live_streams_viewers
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_view_count();

ALTER TABLE stream_history RENAME COLUMN "streamerId" TO "userId";

ALTER TABLE stream_history RENAME CONSTRAINT "stream_history_streamerId_fkey" TO "stream_history_userId_fkey";

ALTER TABLE stream_history RENAME COLUMN views TO "liveViews";

ALTER TABLE stream_history ALTER COLUMN "liveViews" TYPE bigint;
ALTER TABLE stream_history ALTER COLUMN "liveViews" SET DEFAULT 0;
UPDATE stream_history SET "liveViews" = 0 WHERE "liveViews" IS NULL;
ALTER TABLE stream_history ALTER COLUMN "liveViews" SET NOT NULL;
ALTER TABLE stream_history ADD CONSTRAINT live_views_positive_number_check CHECK ("liveViews" >= 0);

ALTER TABLE stream_history ALTER COLUMN upvote SET DEFAULT 0;
UPDATE stream_history SET "upvote" = 0 WHERE "upvote" IS NULL;
ALTER TABLE stream_history ALTER COLUMN upvote SET NOT NULL;
ALTER TABLE stream_history ADD CONSTRAINT upvote_positive_number_check CHECK (upvote >= 0);

ALTER TABLE stream_history ALTER COLUMN downvote SET DEFAULT 0;
UPDATE stream_history SET "downvote" = 0 WHERE "downvote" IS NULL;
ALTER TABLE stream_history ALTER COLUMN downvote SET NOT NULL;
ALTER TABLE stream_history ADD CONSTRAINT downvote_positive_number_check CHECK (downvote >= 0);

ALTER TABLE stream_history ADD COLUMN "recordedViews" bigint NOT NULL DEFAULT 0;
ALTER TABLE stream_history ADD CONSTRAINT recorded_views_positive_number_check CHECK ("recordedViews" >= 0);

ALTER TABLE stream_history ADD COLUMN "totalViews" bigint GENERATED ALWAYS AS ("recordedViews" + "liveViews") STORED;

CREATE TABLE IF NOT EXISTS "users_recorded_streams_viewers" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" uuid REFERENCES users ON DELETE CASCADE,
    "streamId" uuid NOT NULL REFERENCES "stream_history" ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ON users_recorded_streams_viewers ("userId", "streamId");

CREATE TRIGGER update_recorded_view_count
BEFORE INSERT ON users_recorded_streams_viewers
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_view_count();

ALTER TABLE users ALTER COLUMN "firstName" SET DEFAULT '';
UPDATE users SET "firstName" = '' WHERE "firstName" IS NULL;

ALTER TABLE users ALTER COLUMN "lastName" SET DEFAULT '';
UPDATE users SET "lastName" = '' WHERE "lastName" IS NULL;

ALTER TABLE users ALTER COLUMN "bio" SET DEFAULT '';
UPDATE users SET "bio" = '' WHERE "bio" IS NULL;
ALTER TABLE users ALTER COLUMN "bio" SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT bio_max_length_check CHECK (char_length(bio) <= 150);

ALTER TABLE stream_history ALTER COLUMN duration SET DEFAULT 0;
UPDATE stream_history SET "duration" = 0 WHERE "duration" IS NULL;

ALTER TABLE stream_history ADD COLUMN "completedAt" TIMESTAMPTZ;
UPDATE stream_history SET "completedAt" = "createdAt" + "duration" * interval '1' second;
ALTER TABLE stream_history ALTER COLUMN "completedAt" SET DEFAULT NOW();
ALTER TABLE stream_history ALTER COLUMN "completedAt" SET NOT NULL;

ALTER TABLE stream_history DROP COLUMN duration;
ALTER TABLE stream_history ADD COLUMN "duration" INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))::INTEGER) STORED;

ALTER TABLE call_history ALTER COLUMN duration SET DEFAULT 0;
UPDATE call_history SET "duration" = 0 WHERE "duration" IS NULL;

ALTER TABLE call_history ADD COLUMN "completedAt" TIMESTAMPTZ;
UPDATE call_history SET "completedAt" = "createdAt" + "duration" * interval '1' second;
ALTER TABLE call_history ALTER COLUMN "completedAt" SET DEFAULT NOW();
ALTER TABLE call_history ALTER COLUMN "completedAt" SET NOT NULL;

ALTER TABLE call_history DROP COLUMN duration;
ALTER TABLE call_history ADD COLUMN "duration" INTEGER GENERATED ALWAYS AS (EXTRACT(EPOCH FROM ("completedAt" - "createdAt"))::INTEGER) STORED;

ALTER TABLE call_history RENAME "calleeDescription" TO "calleeRatingDescription";
ALTER TABLE call_history RENAME "callerDescription" TO "callerRatingDescription";

ALTER TABLE users_posts ALTER COLUMN edited SET NOT NULL;

ALTER TABLE reported_users ADD CONSTRAINT "userId_not_equal_reportedBy_check" CHECK ("userId" <> "reportedBy");

ALTER TABLE users ADD COLUMN "fullName" TEXT GENERATED ALWAYS AS ("firstName" || ' ' || "lastName") STORED;

ALTER TABLE users RENAME COLUMN "isBlacklisted" TO "banned";

ALTER INDEX "users_isBlacklisted_idx" RENAME TO "users_banned_idx";

ALTER TABLE deleted_users RENAME COLUMN "isBlacklisted" TO "banned";

ALTER TABLE users_stream_reactions RENAME TO users_streams_reactions;

ALTER TABLE users_streams_reactions DROP CONSTRAINT users_stream_reactions_pkey;

ALTER TABLE users_streams_reactions DROP COLUMN "id";

ALTER TABLE users_streams_reactions ADD PRIMARY KEY ("userId", "streamId");

ALTER TABLE users_streams_reactions
DROP CONSTRAINT "users_stream_reactions_userId_fkey",
ADD CONSTRAINT "users_streams_reactions_userId_fkey"
   FOREIGN KEY ("userId")
   REFERENCES users
   ON DELETE CASCADE;

ALTER TABLE users_streams_reactions RENAME CONSTRAINT "users_stream_reactions_streamId_fkey" TO "users_streams_reactions_streamId_fkey";

ALTER INDEX "users_stream_reactions_streamId_idx" RENAME TO "users_streams_reactions_streamId_idx";

CREATE TABLE IF NOT EXISTS "users_streams_reactions_total" (
    "streamId" uuid NOT NULL REFERENCES stream_history ON DELETE CASCADE,
    "reaction" users_stream_reactions_enum NOT NULL,
    "count" integer NOT NULL,
    PRIMARY KEY ("streamId", "reaction")
);

-- migrate data from stream_history into this new table
DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT * FROM stream_history
    LOOP
    INSERT INTO users_streams_reactions_total("streamId", "reaction", "count")
        VALUES (rec.id, 'upvote', rec.upvote);
    INSERT INTO users_streams_reactions_total("streamId", "reaction", "count")
        VALUES (rec.id, 'downvote', rec.downvote);
    END LOOP;
END;
$$;

ALTER TABLE stream_history DROP COLUMN upvote;

ALTER TABLE stream_history DROP COLUMN downvote;

ALTER TABLE deleted_users ADD COLUMN "numPosts" INTEGER;

CREATE OR REPLACE FUNCTION trigger_update_stream_reactions_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users_streams_reactions_total ("streamId", "reaction", "count") VALUES (new."streamId", new."reaction", 1)
    ON CONFLICT ON CONSTRAINT users_streams_reactions_total_pkey
    DO UPDATE SET count=users_streams_reactions_total.count + 1;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users_streams_reactions_total SET count=count-1 WHERE "streamId"=old."streamId" AND reaction=old.reaction RETURNING count INTO current_count;
    IF (current_count <= 0) THEN
        DELETE FROM users_streams_reactions_total WHERE "streamId"=old."streamId" AND reaction=old.reaction;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO users_streams_reactions_total ("streamId", "reaction", "count") VALUES (new."streamId", new."reaction", 1)
    ON CONFLICT ON CONSTRAINT users_streams_reactions_total_pkey
    DO UPDATE SET count=users_streams_reactions_total.count + 1;
    UPDATE users_streams_reactions_total SET count=count-1 WHERE "streamId"=old."streamId" AND reaction=old.reaction RETURNING count INTO current_count;
    IF (current_count <= 0) THEN
        DELETE FROM users_streams_reactions_total WHERE "streamId"=old."streamId" AND reaction=old.reaction;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stream_reactions_count
AFTER INSERT OR DELETE OR UPDATE ON users_streams_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_stream_reactions_count();

CREATE EXTENSION pg_trgm;
