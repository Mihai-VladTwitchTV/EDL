-- ============================================================
-- Employee Digital Library - Database Schema
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy/typo-tolerant search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('EMPLOYEE', 'MASTER_MENTOR', 'HR_ADMIN');
CREATE TYPE content_type AS ENUM ('DOCUMENT', 'VIDEO', 'QUIZ');
CREATE TYPE content_status AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE notification_type AS ENUM ('MANDATORY_CONTENT', 'NEW_CONTENT', 'CONTENT_REQUEST_UPDATE', 'REMINDER', 'SYSTEM');
CREATE TYPE language_code AS ENUM ('RO', 'EN');
CREATE TYPE quiz_question_type AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE');

-- ============================================================
-- DEPARTMENTS
-- ============================================================

CREATE TABLE departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO departments (name, description) VALUES
    ('Operations', 'Production floor and warehouse staff'),
    ('IT', 'Information Technology and systems'),
    ('HR', 'Human Resources and compliance'),
    ('Management', 'Department and company management'),
    ('Sales', 'Sales and customer relations'),
    ('Finance', 'Finance and accounting');

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    role            user_role NOT NULL DEFAULT 'EMPLOYEE',
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    preferred_lang  language_code NOT NULL DEFAULT 'RO',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url      VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at   TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- CONTENT CATEGORIES (tags for filtering)
-- ============================================================

CREATE TABLE categories (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    icon_name   VARCHAR(50),           -- icon identifier for the mobile app
    color_hex   VARCHAR(7) DEFAULT '#6366F1',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO categories (name, icon_name, color_hex) VALUES
    ('Safety Procedures', 'shield-check', '#EF4444'),
    ('Machine Tutorials', 'wrench', '#F59E0B'),
    ('HR Policies', 'document-text', '#3B82F6'),
    ('Onboarding', 'academic-cap', '#10B981'),
    ('Compliance', 'clipboard-list', '#8B5CF6'),
    ('IT Guides', 'computer-desktop', '#06B6D4'),
    ('General', 'book-open', '#6B7280');

-- ============================================================
-- CONTENT ITEMS
-- ============================================================

CREATE TABLE content_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               VARCHAR(255) NOT NULL,
    description         TEXT,
    content_type        content_type NOT NULL,
    status              content_status NOT NULL DEFAULT 'DRAFT',
    is_mandatory        BOOLEAN NOT NULL DEFAULT FALSE,
    language            language_code NOT NULL DEFAULT 'RO',
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    author_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    approved_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    version             INTEGER NOT NULL DEFAULT 1,
    view_count          INTEGER NOT NULL DEFAULT 0,
    thumbnail_url       VARCHAR(500),
    -- Full-text search vector (updated by trigger)
    search_vector       TSVECTOR,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_mandatory ON content_items(is_mandatory);
CREATE INDEX idx_content_category ON content_items(category_id);
CREATE INDEX idx_content_author ON content_items(author_id);
CREATE INDEX idx_content_search ON content_items USING GIN(search_vector);
-- Trigram index for fuzzy search
CREATE INDEX idx_content_title_trgm ON content_items USING GIN(title gin_trgm_ops);

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_content_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('romanian', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.description, ''));
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_search_vector
    BEFORE INSERT OR UPDATE ON content_items
    FOR EACH ROW EXECUTE FUNCTION update_content_search_vector();

-- Department targeting for content (many-to-many)
CREATE TABLE content_departments (
    content_id      UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    department_id   UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    PRIMARY KEY (content_id, department_id)
);

-- ============================================================
-- CONTENT BODY (type-specific storage)
-- ============================================================

-- For DOCUMENT type
CREATE TABLE content_documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id  UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
    body_html   TEXT,          -- rich text body
    file_url    VARCHAR(500)   -- optional attached PDF/file
);

-- For VIDEO type
CREATE TABLE content_videos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id      UUID NOT NULL UNIQUE REFERENCES content_items(id) ON DELETE CASCADE,
    video_url       VARCHAR(500) NOT NULL,
    duration_secs   INTEGER,
    subtitle_url    VARCHAR(500),   -- VTT/SRT file for accessibility
    transcript_text TEXT            -- searchable transcript
);

-- For QUIZ type
CREATE TABLE quiz_questions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id      UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    question_text   TEXT NOT NULL,
    question_type   quiz_question_type NOT NULL DEFAULT 'SINGLE_CHOICE',
    position        INTEGER NOT NULL DEFAULT 0,
    explanation     TEXT            -- shown after answering
);

CREATE TABLE quiz_answers (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id     UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    answer_text     TEXT NOT NULL,
    is_correct      BOOLEAN NOT NULL DEFAULT FALSE,
    position        INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- USER CONTENT INTERACTIONS
-- ============================================================

-- Tracks reads, views, completion, acknowledgments
CREATE TABLE user_content_progress (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id          UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    acknowledged        BOOLEAN NOT NULL DEFAULT FALSE,  -- for mandatory content
    acknowledged_at     TIMESTAMPTZ,
    completed           BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at        TIMESTAMPTZ,
    progress_pct        SMALLINT DEFAULT 0,             -- 0-100 for video progress
    last_accessed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

CREATE INDEX idx_progress_user ON user_content_progress(user_id);
CREATE INDEX idx_progress_content ON user_content_progress(content_id);
CREATE INDEX idx_progress_acknowledged ON user_content_progress(acknowledged) WHERE acknowledged = FALSE;

-- Quiz attempt results
CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id      UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    score_pct       SMALLINT NOT NULL,      -- 0-100
    passed          BOOLEAN NOT NULL,
    attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content ratings / feedback
CREATE TABLE content_ratings (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id  UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    is_outdated BOOLEAN NOT NULL DEFAULT FALSE,  -- "flag as outdated" feature
    rated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- ============================================================
-- CERTIFICATIONS
-- ============================================================

CREATE TABLE certifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(200) NOT NULL,
    description     TEXT,
    content_id      UUID REFERENCES content_items(id) ON DELETE SET NULL,  -- the quiz that grants it
    pass_threshold  SMALLINT NOT NULL DEFAULT 70,   -- minimum % to pass
    valid_days      INTEGER,                         -- NULL = never expires
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_certifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certification_id UUID NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    is_valid        BOOLEAN GENERATED ALWAYS AS (expires_at IS NULL OR expires_at > NOW()) STORED
);

CREATE INDEX idx_user_certs_user ON user_certifications(user_id);
CREATE INDEX idx_user_certs_valid ON user_certifications(is_valid);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            notification_type NOT NULL,
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    content_id      UUID REFERENCES content_items(id) ON DELETE SET NULL,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;

-- FCM/push tokens for mobile devices
CREATE TABLE device_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       VARCHAR(500) NOT NULL UNIQUE,
    platform    VARCHAR(10) NOT NULL DEFAULT 'expo', -- 'expo', 'fcm', 'apns'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTENT REQUESTS (empty search → request flow)
-- ============================================================

CREATE TABLE content_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_term     VARCHAR(255),       -- pre-filled from failed search
    description     TEXT NOT NULL,
    status          VARCHAR(30) NOT NULL DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
    resolved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_status ON content_requests(status);

-- ============================================================
-- COMPLIANCE REPORTS (HR export)
-- ============================================================

-- View: per-user completion status for mandatory content
CREATE VIEW mandatory_compliance_view AS
SELECT
    u.id AS user_id,
    u.full_name,
    u.email,
    d.name AS department,
    ci.id AS content_id,
    ci.title AS content_title,
    ci.created_at AS published_at,
    ucp.acknowledged,
    ucp.acknowledged_at,
    ucp.completed
FROM content_items ci
JOIN content_departments cd ON cd.content_id = ci.id
JOIN users u ON u.department_id = cd.department_id
JOIN departments d ON d.id = u.department_id
LEFT JOIN user_content_progress ucp ON ucp.content_id = ci.id AND ucp.user_id = u.id
WHERE ci.is_mandatory = TRUE
  AND ci.status = 'PUBLISHED'
  AND u.is_active = TRUE;

-- ============================================================
-- SEED DATA (demo admin user, password: Admin@123)
-- ============================================================

-- password_hash is BCrypt of 'Admin@123'
INSERT INTO users (email, password_hash, full_name, role, preferred_lang) VALUES
    ('admin@edl.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TqzneflfijxivNVzjdFPRFfvJFKq', 'System Admin', 'HR_ADMIN', 'RO');
