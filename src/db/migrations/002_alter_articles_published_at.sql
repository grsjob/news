-- Alter articles table to allow NULL values for published_at
ALTER TABLE articles ALTER COLUMN published_at DROP NOT NULL;