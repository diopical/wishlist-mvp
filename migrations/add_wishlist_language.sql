-- Migration to add language preference for wishlists

ALTER TABLE wishes
ADD COLUMN IF NOT EXISTS language VARCHAR(2) NOT NULL DEFAULT 'en';

CREATE INDEX IF NOT EXISTS idx_wishes_language ON wishes(language);
