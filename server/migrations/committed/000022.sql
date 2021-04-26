--! Previous: sha1:3a5bcc62bef94cdd5159667de33be6a49faee5bd
--! Hash: sha1:d6102e2c8f770282fc3af052872ba61941603f47

-- Enter migration here
CREATE TABLE IF NOT EXISTS "users_posts_comments" (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ON users_posts_comments ("postId");

CREATE INDEX ON users_posts_comments ("createdAt");

CREATE TABLE IF NOT EXISTS "users_posts_comments_total" (
    "postId" uuid NOT NULL REFERENCES users_posts ON DELETE CASCADE PRIMARY KEY,
    "count" integer,
    CONSTRAINT count_is_positive_check CHECK (count >= 0)
);

DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT * FROM users_posts
    LOOP
        INSERT INTO users_posts_comments_total ("postId", "count") VALUES (rec.id, 0);
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users_posts_comments_total SET count=users_posts_comments_total.count + 1 WHERE "postId"=new."postId";
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users_posts_comments_total SET count=count-1 WHERE "postId"=old."postId";
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_post_comments_count
AFTER INSERT OR DELETE ON users_posts_comments
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_post_comments_count();

DROP TRIGGER initial_post_reactions_count ON users_posts;

DROP FUNCTION trigger_initial_post_reactions_count;

CREATE OR REPLACE FUNCTION trigger_initial_post_reactions_and_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users_posts_reactions_total ("postId", "reaction", "count") VALUES (new.id, 'like', 0);
    INSERT INTO users_posts_comments_total ("postId", "count") VALUES (new.id, 0);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER initial_post_reactions_and_comments_count
AFTER INSERT ON users_posts
FOR EACH ROW
EXECUTE PROCEDURE trigger_initial_post_reactions_and_comments_count();
