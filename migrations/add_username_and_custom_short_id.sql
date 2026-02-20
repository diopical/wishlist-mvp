-- Migration to add username support and custom_short_id for wishlists

-- 1. Add username column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(20) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 2. Add custom_short_id column to wishes table (wishlists)
ALTER TABLE wishes 
ADD COLUMN IF NOT EXISTS custom_short_id VARCHAR(20) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishes_custom_short_id ON wishes(custom_short_id);

-- 3. Add trigger to auto-populate username from email on profile creation
-- Optional: Run this if you want automatic username generation from email
-- CREATE OR REPLACE FUNCTION set_default_username()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.username IS NULL AND auth.jwt()->>'email' IS NOT NULL THEN
--     NEW.username := SPLIT_PART(auth.jwt()->>'email', '@', 1);
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_set_default_username
-- BEFORE INSERT ON profiles
-- FOR EACH ROW
-- EXECUTE FUNCTION set_default_username();
