-- Create discussion types enum
DO $$ BEGIN
    CREATE TYPE discussion_type AS ENUM ('general', 'question', 'announcement', 'resource');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create discussions table
CREATE TABLE IF NOT EXISTS discussions (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type discussion_type NOT NULL DEFAULT 'general',
    is_pinned BOOLEAN DEFAULT FALSE NOT NULL,
    is_locked BOOLEAN DEFAULT FALSE NOT NULL,
    view_count INTEGER DEFAULT 0 NOT NULL,
    reply_count INTEGER DEFAULT 0 NOT NULL,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create discussion replies table
CREATE TABLE IF NOT EXISTS discussion_replies (
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    discussion_id INTEGER NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    parent_id INTEGER REFERENCES discussion_replies(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0 NOT NULL,
    downvotes INTEGER DEFAULT 0 NOT NULL,
    is_accepted BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create discussion views table (tracks unique views)
CREATE TABLE IF NOT EXISTS discussion_views (
    discussion_id INTEGER NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (discussion_id, user_id)
);

-- Create discussion votes table (for upvotes/downvotes on replies)
CREATE TABLE IF NOT EXISTS discussion_votes (
    reply_id INTEGER NOT NULL REFERENCES discussion_replies(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    PRIMARY KEY (reply_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_discussions_class ON discussions(class_id);
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_type ON discussions(type);
CREATE INDEX IF NOT EXISTS idx_discussions_pinned ON discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON discussions(last_activity_at);

CREATE INDEX IF NOT EXISTS idx_replies_discussion ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS idx_replies_author ON discussion_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_replies_parent ON discussion_replies(parent_id);
CREATE INDEX IF NOT EXISTS idx_replies_accepted ON discussion_replies(is_accepted);

CREATE INDEX IF NOT EXISTS idx_views_user ON discussion_views(user_id);

CREATE INDEX IF NOT EXISTS idx_votes_user ON discussion_votes(user_id);
