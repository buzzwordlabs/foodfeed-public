--! Previous: sha1:aba2a0a537c059da2c6a034a8e8f92f8914346c5
--! Hash: sha1:55b20a3601615939d0200e6ed1ae32b7e94b9995

DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT users_activities_post_comments.id, users_posts_comments."createdAt" FROM users_activities_post_comments JOIN users_posts_comments ON users_activities_post_comments."postCommentId"=users_posts_comments.id
    LOOP
    UPDATE users_activities SET "createdAt"=rec."createdAt" WHERE id=rec.id;
    END LOOP;
END;
$$;

DO LANGUAGE PLPGSQL $$
DECLARE
rec record;
BEGIN
    FOR rec IN SELECT users_activities_post_reactions.id, users_posts_reactions."createdAt" FROM users_activities_post_reactions JOIN users_posts_reactions ON users_activities_post_reactions."postId"=users_posts_reactions."postId" AND users_activities_post_reactions."reacterId"=users_posts_reactions."userId" AND users_activities_post_reactions."reaction"=users_posts_reactions."reaction"
    LOOP
    UPDATE users_activities SET "createdAt"=rec."createdAt" WHERE id=rec.id;
    END LOOP;
END;
$$;

ALTER TABLE users_followers ADD COLUMN "createdAt" TIMESTAMPTZ;
ALTER TABLE users_followers ALTER COLUMN "createdAt" SET DEFAULT NOW();

ALTER TABLE users_blocklist ADD COLUMN "createdAt" TIMESTAMPTZ;
ALTER TABLE users_blocklist ALTER COLUMN "createdAt" SET DEFAULT NOW();
