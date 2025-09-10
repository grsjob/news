-- Create articles table for deduplication
CREATE TABLE IF NOT EXISTS articles (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    url TEXT UNIQUE NOT NULL,
    source TEXT NOT NULL,
    published_at TIMESTAMP,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on title for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS idx_articles_url ON articles(url);

-- Create index on published_at for cleanup queries
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);

-- Create index on sent for filtering
CREATE INDEX IF NOT EXISTS idx_articles_sent ON articles(sent);