--! Previous: sha1:8e69fea9891390eba372d238ff2f583eecf40766
--! Hash: sha1:aba2a0a537c059da2c6a034a8e8f92f8914346c5

CREATE TABLE allowed_reaction_lookup (
 "reaction" TEXT PRIMARY KEY
);

INSERT INTO allowed_reaction_lookup ("reaction")
VALUES
('like'),
('thumbs_up'),
('yum'),
('slight_smile'),
('smile'),
('joy'),
('blush_smile'),
('heart_eyes'),
('curry_rice'),
('bento_box'),
('salad'),
('peach'),
('hamburger'),
('pizza'),
('burrito'),
('taco'),
('hot_beverage'),
('ice_cream'),
('fire');

ALTER TABLE users_recorded_streams_viewers ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE users_posts_reactions ADD CONSTRAINT users_posts_reactions_reaction_fkey
FOREIGN KEY ("reaction") REFERENCES allowed_reaction_lookup("reaction")
ON UPDATE CASCADE ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "users_conversations" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users_conversations_participants" (
    "conversationId" uuid NOT NULL REFERENCES users_conversations ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("conversationId", "userId")
);

CREATE INDEX ON "users_conversations_participants" ("userId");

CREATE TABLE IF NOT EXISTS "users_conversations_messages" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "message" TEXT NOT NULL,
    "conversationId" uuid NOT NULL REFERENCES users_conversations ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ON users_conversations_messages ("conversationId", "userId");

CREATE INDEX ON users_conversations_messages ("createdAt");

CREATE TABLE IF NOT EXISTS "users_conversations_participants_messages_statuses" (
    "messageId" uuid NOT NULL REFERENCES users_conversations_messages ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "conversationId" uuid NOT NULL REFERENCES users_conversations ON DELETE CASCADE,
    "read" BOOLEAN NOT NULL DEFAULT FALSE,
    "readAt" TIMESTAMPTZ,
    PRIMARY KEY ("messageId", "userId")
);

CREATE INDEX ON users_conversations_participants_messages_statuses ("read");

CREATE OR REPLACE FUNCTION trigger_update_read_message_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."read" = TRUE THEN
    NEW."readAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_read_message_timestamp
BEFORE UPDATE ON users_conversations_participants_messages_statuses
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_read_message_timestamp();

CREATE TABLE IF NOT EXISTS "users_conversations_messages_unread_count_total" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE PRIMARY KEY,
    "count" BIGINT NOT NULL
);

CREATE OR REPLACE FUNCTION trigger_update_unread_conversation_messages_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (NEW."read" = FALSE) THEN
        UPDATE users_conversations_messages_unread_count_total
        SET count=users_conversations_messages_unread_count_total.count + 1
        WHERE users_conversations_messages_unread_count_total."userId"=new."userId";
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (NEW."read" = TRUE AND OLD."read" = FALSE) THEN
        UPDATE users_conversations_messages_unread_count_total
        SET count=users_conversations_messages_unread_count_total.count-1
        WHERE "userId"=new."userId";
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF (OLD."read" = FALSE) THEN
        UPDATE users_conversations_messages_unread_count_total
        SET count=users_conversations_messages_unread_count_total.count-1
        WHERE "userId"=OLD."userId";
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unread_conversation_messages_count
AFTER INSERT OR UPDATE OR DELETE ON users_conversations_participants_messages_statuses
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_unread_conversation_messages_count();

CREATE OR REPLACE FUNCTION trigger_insert_users_conversations_participants_messages_statuses()
RETURNS TRIGGER AS $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT "userId" FROM users_conversations_participants WHERE "conversationId"=new."conversationId"
    LOOP
        IF rec."userId"=new."userId" THEN
            INSERT INTO users_conversations_participants_messages_statuses ("messageId", "userId", "conversationId", "read", "readAt")
            VALUES (new."id", rec."userId", new."conversationId", TRUE, NOW());
        ELSE
            INSERT INTO users_conversations_participants_messages_statuses ("messageId", "userId", "conversationId")
            VALUES (new."id", rec."userId", new."conversationId");
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER insert_users_conversations_participants_messages_statuses
AFTER INSERT ON users_conversations_messages
FOR EACH ROW
EXECUTE PROCEDURE trigger_insert_users_conversations_participants_messages_statuses();

CREATE TABLE IF NOT EXISTS "users_conversations_participants_messages_reactions" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "messageId" uuid NOT NULL REFERENCES users_conversations_messages ON DELETE CASCADE,
    "reaction" TEXT NOT NULL REFERENCES allowed_reaction_lookup ON UPDATE CASCADE ON DELETE CASCADE,
    "conversationId" uuid NOT NULL REFERENCES users_conversations ON DELETE CASCADE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted" BOOLEAN NOT NULL DEFAULT FALSE,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("messageId", "userId", "reaction")
);

CREATE TABLE IF NOT EXISTS "users_conversations_participants_messages_reactions_total" (
    "messageId" uuid NOT NULL REFERENCES users_conversations_messages ON DELETE CASCADE,
    "reaction" TEXT NOT NULL REFERENCES allowed_reaction_lookup ON UPDATE CASCADE ON DELETE CASCADE,
    "conversationId" uuid NOT NULL REFERENCES users_conversations ON DELETE CASCADE,
    "count" SMALLINT,
    PRIMARY KEY ("messageId", "reaction")
);

CREATE OR REPLACE FUNCTION trigger_update_conversation_messages_reactions_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users_conversations_participants_messages_reactions_total ("messageId", "reaction", "conversationId", "count") VALUES (new."messageId", new."reaction", new."conversationId", 1)
    ON CONFLICT ON CONSTRAINT users_conversations_participants_messages_reactions_total_pkey
    DO UPDATE SET count=users_conversations_participants_messages_reactions_total.count + 1;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD."deleted"=FALSE AND NEW."deleted"=TRUE) THEN
        UPDATE users_conversations_participants_messages_reactions_total SET count=count-1 WHERE "messageId"=old."messageId" AND reaction=old.reaction RETURNING count INTO current_count;
        IF (current_count <= 0) THEN
            DELETE FROM users_conversations_participants_messages_reactions_total WHERE "messageId"=old."messageId" AND reaction=old.reaction;
        END IF;
    ELSIF (OLD."deleted" = TRUE AND NEW."deleted"=FALSE) THEN
        INSERT INTO users_conversations_participants_messages_reactions_total ("messageId", "reaction", "conversationId", "count") VALUES (new."messageId", new."reaction", new."conversationId", 1)
        ON CONFLICT ON CONSTRAINT users_conversations_participants_messages_reactions_total_pkey
        DO UPDATE SET count=users_conversations_participants_messages_reactions_total.count + 1;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF (OLD."deleted"=FALSE) THEN
        UPDATE users_conversations_participants_messages_reactions_total SET count=count-1 WHERE "messageId"=old."messageId" AND reaction=old.reaction RETURNING count INTO current_count;
        IF (current_count <= 0) THEN
            DELETE FROM users_conversations_participants_messages_reactions_total WHERE "messageId"=old."messageId" AND reaction=old.reaction;
        END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_messages_reactions_count
AFTER INSERT OR UPDATE OR DELETE ON users_conversations_participants_messages_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_conversation_messages_reactions_count();

CREATE TYPE "users_activities_enum" AS ENUM('post-reaction', 'post-comment', 'new-follower');

CREATE TABLE IF NOT EXISTS "users_activities" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "type" users_activities_enum NOT NULL,
    "viewed" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users_activities_unread_count_total" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE PRIMARY KEY,
    "count" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS "users_activities_new_followers" (
    "followerId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    CHECK ("type" = 'new-follower')
) INHERITS ("users_activities");

CREATE TABLE IF NOT EXISTS "users_activities_post_comments" (
    "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE,
    "commenterId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "postCommentId" uuid NOT NULL REFERENCES users_posts_comments ON DELETE CASCADE,
    CHECK ("type" = 'post-comment')
) INHERITS ("users_activities");

CREATE TABLE IF NOT EXISTS "users_activities_post_reactions" (
    "postId" uuid NOT NULL,
    "reacterId" uuid NOT NULL,
    "reaction" TEXT NOT NULL REFERENCES allowed_reaction_lookup ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY ("postId", "reacterId", "reaction") REFERENCES users_posts_reactions("postId", "userId", "reaction") ON DELETE CASCADE,
    CHECK ("type" = 'post-reaction')
) INHERITS ("users_activities");

CREATE INDEX ON "users_activities" ("userId", "viewed", "createdAt");

CREATE OR REPLACE FUNCTION trigger_users_followers_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users_activities_new_followers ("userId", "type", "followerId") VALUES (new."userId", 'new-follower', new."followerId");
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_followers_activity
AFTER INSERT ON users_followers
FOR EACH ROW
EXECUTE PROCEDURE trigger_users_followers_activity();

CREATE OR REPLACE FUNCTION trigger_users_posts_comments_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
BEGIN
    SELECT "userId" INTO "current_user_id" FROM users_posts WHERE "id"=new."postId";
    INSERT INTO users_activities_post_comments ("userId", "type", "postId", "commenterId", "postCommentId") VALUES (current_user_id, 'post-comment', new."postId", new."userId", new.id);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_posts_comments_activity
AFTER INSERT ON users_posts_comments
FOR EACH ROW
EXECUTE PROCEDURE trigger_users_posts_comments_activity();

CREATE OR REPLACE FUNCTION trigger_users_posts_reactions_activity()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
BEGIN
    SELECT "userId" INTO "current_user_id" FROM users_posts WHERE "id"=new."postId";
    INSERT INTO users_activities_post_reactions ("userId", "type", "postId", "reacterId", "reaction") VALUES (current_user_id, 'post-reaction', new."postId", new."userId", new.reaction);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_posts_reactions_activity
AFTER INSERT ON users_posts_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_users_posts_reactions_activity();

CREATE OR REPLACE FUNCTION trigger_update_unread_activities_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF (NEW."viewed" = FALSE) THEN
        UPDATE users_activities_unread_count_total
        SET count=users_activities_unread_count_total.count + 1
        WHERE users_activities_unread_count_total."userId"=new."userId";
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF (OLD."viewed" = FALSE) THEN
        UPDATE users_activities_unread_count_total
        SET count =
        (
            CASE
            WHEN count < 0 THEN 0
            ELSE count - 1
            END
        )
        WHERE users_activities_unread_count_total."userId"=old."userId";
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unread_activities_count
AFTER INSERT OR DELETE ON users_activities_new_followers
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_unread_activities_count();

CREATE TRIGGER update_unread_activities_count
AFTER INSERT OR DELETE ON users_activities_post_comments
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_unread_activities_count();

CREATE TRIGGER update_unread_activities_count
AFTER INSERT OR DELETE ON users_activities_post_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_unread_activities_count();

-- when a new user gets created, initialize unread counts
CREATE OR REPLACE FUNCTION trigger_init_unread_count_totals()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users_activities_unread_count_total("userId", "count")
        VALUES (new.id, 0);
    INSERT INTO users_conversations_messages_unread_count_total("userId", "count")
        VALUES (new.id, 0);
    RETURN NULL;
END;
$$ LANGUAGE PLPGSQL;

CREATE TRIGGER init_unread_count_totals
AFTER INSERT ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_init_unread_count_totals();

-- add an unread activity count and unread message count for each user
DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT id FROM users
    LOOP
    INSERT INTO users_activities_unread_count_total("userId", "count")
        VALUES (rec.id, 0);
    INSERT INTO users_conversations_messages_unread_count_total("userId", "count")
        VALUES (rec.id, 0);
    END LOOP;
END;
$$;

--backfill the activities we haven't added so far
DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT * FROM users_followers
    LOOP
    INSERT INTO users_activities_new_followers ("userId", "type", "followerId") VALUES (rec."userId", 'new-follower', rec."followerId");
    END LOOP;
END;
$$;

DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
current_user_id uuid;
BEGIN
    FOR rec IN SELECT * FROM users_posts_comments
    LOOP
    SELECT "userId" INTO "current_user_id" FROM users_posts WHERE "id"=rec."postId";
    INSERT INTO users_activities_post_comments ("userId", "type", "postId", "commenterId", "postCommentId") VALUES (current_user_id, 'post-comment', rec."postId", rec."userId", rec.id);
    END LOOP;
END;
$$;

DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
current_user_id uuid;
BEGIN
    FOR rec IN SELECT * FROM users_posts_reactions
    LOOP
    SELECT "userId" INTO "current_user_id" FROM users_posts WHERE "id"=rec."postId";
    INSERT INTO users_activities_post_reactions ("userId", "type", "postId", "reacterId", "reaction") VALUES (current_user_id, 'post-reaction', rec."postId", rec."userId", rec.reaction);
    END LOOP;
END;
$$;

ALTER TABLE users_posts_reactions ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users_posts_reactions ADD COLUMN "updatedAt" TIMESTAMPTZ;

UPDATE users_posts_reactions SET "updatedAt" = "createdAt";

ALTER TABLE users_posts_reactions ALTER COLUMN "updatedAt" SET DEFAULT NOW();

ALTER TABLE users_posts_reactions ALTER COLUMN "updatedAt" SET NOT NULL;

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users_posts_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE OR REPLACE FUNCTION trigger_update_post_reactions_count()
RETURNS TRIGGER AS $$
DECLARE
    current_count integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users_posts_reactions_total ("postId", "reaction", "count") VALUES (new."postId", new."reaction", 1)
    ON CONFLICT ON CONSTRAINT users_posts_reactions_total_pkey
    DO UPDATE SET count=users_posts_reactions_total.count + 1;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD."deleted" = FALSE AND NEW."deleted" = TRUE) THEN
        UPDATE users_posts_reactions_total SET count=count-1 WHERE "postId"=old."postId" AND reaction=old.reaction RETURNING count INTO current_count;
        IF (current_count <= 0 AND old.reaction <> 'like') THEN
            DELETE FROM users_posts_reactions_total WHERE "postId"=old."postId" AND reaction=old.reaction;
        END IF;
    ELSIF (OLD."deleted" = TRUE AND NEW."deleted" = FALSE) THEN
        INSERT INTO users_posts_reactions_total ("postId", "reaction", "count") VALUES (new."postId", new."reaction", 1)
        ON CONFLICT ON CONSTRAINT users_posts_reactions_total_pkey
        DO UPDATE SET count=users_posts_reactions_total.count + 1;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users_posts_reactions_total SET count=count-1 WHERE "postId"=old."postId" AND reaction=old.reaction RETURNING count INTO current_count;
    IF (current_count <= 0 AND old.reaction <> 'like') THEN
        DELETE FROM users_posts_reactions_total WHERE "postId"=old."postId" AND reaction=old.reaction;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER update_post_reactions_count ON users_posts_reactions;

CREATE TRIGGER update_post_reactions_count
AFTER INSERT OR UPDATE OR DELETE ON users_posts_reactions
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_post_reactions_count();
