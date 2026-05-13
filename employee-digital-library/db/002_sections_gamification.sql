-- ============================================================
-- Migration 002 — Sections, Gamification, Post Types, New Tables
-- Run manually BEFORE restarting the backend:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/002_sections_gamification.sql
-- ============================================================

-- ── 1. Sections table ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sections (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name          VARCHAR(100) NOT NULL UNIQUE,
    description   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sections_department ON sections(department_id);

-- ── 2. section_id on users ───────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- ── 3. section_id on content_departments ────────────────────
ALTER TABLE content_departments ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL;

-- ── 4. Gamification columns on users ─────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp_points       INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level           INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_days     INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS streak_last_active DATE;

-- ── 5. post_type enum + column on content_items ──────────────
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('TRAINING', 'NEWS', 'EVENT', 'CHANGE', 'CAREER', 'REGULATION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS post_type post_type NOT NULL DEFAULT 'TRAINING';

-- ── 6. Event columns on content_items ────────────────────────
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS event_date     TIMESTAMPTZ;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS event_location VARCHAR(255);

-- ── 7. Career columns on content_items ───────────────────────
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS job_department  VARCHAR(100);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS job_location    VARCHAR(100);
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS application_url VARCHAR(500);

-- ── 8. Feedback table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category     VARCHAR(50) NOT NULL,
    message      TEXT NOT NULL,
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);

-- ── 9. Support tickets ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_tickets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_type VARCHAR(20) NOT NULL,
    subject     VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status      VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_user   ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);

-- ── 10. Company pages ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_pages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug          VARCHAR(100) NOT NULL UNIQUE,
    section       VARCHAR(50) NOT NULL,
    title         VARCHAR(255) NOT NULL,
    body_html     TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_published  BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pages_section ON company_pages(section);

-- ── 11. linked_quiz_id on content_items ──────────────────────
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS linked_quiz_id UUID REFERENCES content_items(id) ON DELETE SET NULL;

-- ── 12. Certification expiry trigger ─────────────────────────
CREATE OR REPLACE FUNCTION set_certification_expiry()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expires_at IS NULL THEN
        SELECT NEW.issued_at + (c.valid_days * INTERVAL '1 day')
        INTO NEW.expires_at
        FROM certifications c
        WHERE c.id = NEW.certification_id
          AND c.valid_days IS NOT NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_certification_expiry ON user_certifications;
CREATE TRIGGER trg_set_certification_expiry
    BEFORE INSERT ON user_certifications
    FOR EACH ROW EXECUTE FUNCTION set_certification_expiry();

-- ── 13. XP events table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type  VARCHAR(50) NOT NULL,
    xp_awarded  INTEGER NOT NULL,
    content_id  UUID REFERENCES content_items(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user ON xp_events(user_id);

-- ── Section seed data ─────────────────────────────────────────
DO $$
DECLARE
    v_logistics UUID;
    v_production UUID;
    v_hr UUID;
    v_it UUID;
BEGIN
    SELECT id INTO v_logistics  FROM departments WHERE name = 'Operations';
    SELECT id INTO v_production FROM departments WHERE name = 'Operations';
    SELECT id INTO v_hr         FROM departments WHERE name = 'HR';
    SELECT id INTO v_it         FROM departments WHERE name = 'IT';

    INSERT INTO sections (department_id, name, description) VALUES
        (v_logistics,  'Warehouse B (Expeditie)',     'Outbound warehouse and dispatch')
      , (v_logistics,  'Receptie Marfa',              'Goods receiving and inspection')
      , (v_production, 'Linia de Asamblare 3',        'Assembly line 3')
      , (v_production, 'Controlul Calitatii (QC)',    'Quality control')
      , (v_hr,         'Onboarding & Training',       'New hire onboarding and training programs')
      , (v_hr,         'Health & Safety (SSM)',       'Workplace health and safety')
      , (v_it,         'Support Tehnic',              'IT helpdesk and technical support')
    ON CONFLICT (name) DO NOTHING;
END $$;
