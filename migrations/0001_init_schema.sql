-- Create drafts table for Bbrite
-- Stores user's work-in-progress and published posts

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  slug TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  metadata TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  github_path TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Index for efficient draft listing
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at
ON drafts(updated_at);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_drafts_status
ON drafts(status);

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_drafts_slug
ON drafts(slug);
