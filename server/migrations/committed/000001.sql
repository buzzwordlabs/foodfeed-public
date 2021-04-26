--! Previous: -
--! Hash: sha1:f7f8ae89bb37270434f2c05d6f43d5c72fdc6a0e

--! split: 1-current.sql
-- Enter migration here

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION trigger_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "topics" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "name" character varying NOT NULL UNIQUE,
    "description" character varying,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TYPE "users_gender_enum" AS ENUM('M', 'F', 'O', 'U');

CREATE TYPE "users_stream_reactions_enum" AS ENUM('upvote', 'downvote');

CREATE TABLE IF NOT EXISTS "users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "firstName" character varying NOT NULL,
    "lastName" character varying NOT NULL,
    "username" character varying NOT NULL UNIQUE,
    "email" character varying NOT NULL UNIQUE,
    "password" character varying NOT NULL,
    "birthdate" DATE NOT NULL,
    "gender" "users_gender_enum" NOT NULL DEFAULT 'U',
    "onboardingStep" integer NOT NULL,
    "resetPasswordToken" integer,
    "resetPasswordExpires" TIMESTAMP,
    "settings" jsonb NOT NULL DEFAULT '{}',
    "avatar" character varying,
    "isBlacklisted" boolean NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ON "users" ("isBlacklisted");

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "call_history" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "callerId" uuid REFERENCES users ON DELETE SET NULL,
    "callerDeviceId" character varying,
    "callerRating" character varying,
    "callerDescription" character varying,
    "calleeId" uuid REFERENCES users ON DELETE SET NULL,
    "calleeDeviceId" character varying,
    "calleeRating" character varying,
    "calleeDescription" character varying,
    "duration" integer,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON call_history
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "stream_history" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "streamerId" uuid REFERENCES users ON DELETE SET NULL,
    "deviceId" character varying,
    "duration" integer,
    "title" character varying NOT NULL,
    "thumbnail" character varying,
    "upvote" integer,
    "downvote" integer,
    "views" integer,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON stream_history
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TYPE "deleted_users_gender_enum" AS ENUM('M', 'F', 'O', 'U');

CREATE TABLE IF NOT EXISTS "deleted_users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "reason" character varying NOT NULL,
    "birthdate" DATE NOT NULL,
    "gender" "deleted_users_gender_enum" NOT NULL DEFAULT 'U',
    "onboardingStep" integer NOT NULL,
    "settings" jsonb NOT NULL DEFAULT '{}',
    "topics" uuid array NOT NULL,
    "followers" integer NOT NULL,
    "following" integer NOT NULL,
    "blockedUsers" integer NOT NULL,
    "numCalls" integer NOT NULL,
    "numStreams" integer NOT NULL,
    "isBlacklisted" boolean NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON deleted_users
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "faqs" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "question" character varying NOT NULL,
    "answer" character varying NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON faqs
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "users_devices" (
    "deviceId" character varying NOT NULL,
    "userId" uuid REFERENCES users ON DELETE SET NULL,
    "platform" character varying NOT NULL,
    "appVersion" character varying NOT NULL,
    "codePushVersion" character varying,
    "systemModel" character varying NOT NULL,
    "systemVersion" character varying NOT NULL,
    "notificationToken" character varying,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY ("userId", "deviceId")
);

CREATE INDEX ON "users_devices" ("notificationToken");

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON users_devices
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "online_users" (
    "deviceId" character varying NOT NULL PRIMARY KEY,
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "socketId" character varying NOT NULL,
    "isStreaming" boolean NOT NULL,
    "streamTitle" character varying,
    "thumbnail" character varying,
    "isViewing" boolean NOT NULL,
    "peerConnectionOffer" jsonb,
    "activeConnection" character varying,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX ON "online_users" ("userId");

CREATE INDEX ON "online_users" ("socketId");

CREATE INDEX ON "online_users" ("isStreaming");

CREATE INDEX ON "online_users" ("activeConnection");

CREATE TABLE IF NOT EXISTS "reported_users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    "userId" uuid REFERENCES users ON DELETE SET NULL,
    "reportedBy" uuid REFERENCES users ON DELETE SET NULL,
    "reason" character varying NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER update_timestamp
BEFORE UPDATE ON reported_users
FOR EACH ROW
EXECUTE PROCEDURE trigger_update_timestamp();

CREATE TABLE IF NOT EXISTS "users_topics" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "topicId" uuid NOT NULL REFERENCES topics ON DELETE CASCADE,
    PRIMARY KEY ("userId", "topicId")
);

CREATE INDEX ON "users_topics" ("topicId");

CREATE TABLE IF NOT EXISTS "users_followers" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "followerId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    PRIMARY KEY ("userId", "followerId")
);

CREATE INDEX ON "users_followers" ("followerId");

CREATE TABLE IF NOT EXISTS "blocked_users" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    "blockedId" uuid NOT NULL REFERENCES users ON DELETE CASCADE,
    PRIMARY KEY ("userId", "blockedId")
);

CREATE INDEX ON "blocked_users" ("blockedId");

CREATE TABLE IF NOT EXISTS "users_stream_reactions" (
    "userId" uuid NOT NULL REFERENCES users ON DELETE SET NULL,
    "streamId" uuid NOT NULL REFERENCES "stream_history" ON DELETE CASCADE,
    "reaction" "users_stream_reactions_enum" NOT NULL,
    PRIMARY KEY ("userId", "streamId")
);

CREATE INDEX ON "users_stream_reactions" ("streamId");

CREATE TABLE IF NOT EXISTS "users_stream_viewers" (
    "viewerId" uuid NOT NULL REFERENCES users ON DELETE SET NULL,
    "streamId" uuid NOT NULL REFERENCES "stream_history" ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY ("viewerId", "streamId")
)
