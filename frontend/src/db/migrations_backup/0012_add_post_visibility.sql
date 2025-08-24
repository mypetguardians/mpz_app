-- Add visibility column to posts (public|center), default public
ALTER TABLE posts ADD COLUMN visibility TEXT DEFAULT 'public' NOT NULL;

