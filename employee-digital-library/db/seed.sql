-- ============================================================
-- Employee Digital Library — Mock Seed Data
-- Run manually:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/seed.sql
--
-- Idempotent: safe to run multiple times (ON CONFLICT DO NOTHING).
-- Requires init.sql to have run first (departments & categories must exist).
-- ============================================================

DO $$
DECLARE
  -- Departments (seeded by init.sql)
  v_dept_hr    UUID;
  v_dept_it    UUID;
  v_dept_ops   UUID;
  v_dept_mgmt  UUID;

  -- Categories (seeded by init.sql)
  v_cat_safety  UUID;
  v_cat_hr      UUID;
  v_cat_it      UUID;
  v_cat_onboard UUID;
  v_cat_machine UUID;

  -- Users
  v_admin   UUID;
  v_mentor  UUID;
  v_usr     UUID;

  -- Content
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;

BEGIN

  -- ── Resolve existing departments ──────────────────────────
  SELECT id INTO v_dept_hr   FROM departments WHERE name = 'HR';
  SELECT id INTO v_dept_it   FROM departments WHERE name = 'IT';
  SELECT id INTO v_dept_ops  FROM departments WHERE name = 'Operations';
  SELECT id INTO v_dept_mgmt FROM departments WHERE name = 'Management';

  -- ── Resolve existing categories ───────────────────────────
  SELECT id INTO v_cat_safety  FROM categories WHERE name = 'Safety Procedures';
  SELECT id INTO v_cat_hr      FROM categories WHERE name = 'HR Policies';
  SELECT id INTO v_cat_it      FROM categories WHERE name = 'IT Guides';
  SELECT id INTO v_cat_onboard FROM categories WHERE name = 'Onboarding';
  SELECT id INTO v_cat_machine FROM categories WHERE name = 'Machine Tutorials';

  -- ── Users ─────────────────────────────────────────────────
  -- Passwords (BCrypt cost 12):
  --   admin123  → $2b$12$G8/k57tg10m7HgC.llCHkuelv0tZUiiHBtXwJrmDzg47E7DMbOTCS
  --   mentor123 → $2b$12$SVZg8qvprToEWc3bq0HSwezbm8Qx9dcHLWNNs/YkKVckQBmROF1xC
  --   user123   → $2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy

  INSERT INTO users (email, password_hash, full_name, role, department_id, preferred_lang, is_active)
  VALUES ('admin@mail.com',
          '$2b$12$G8/k57tg10m7HgC.llCHkuelv0tZUiiHBtXwJrmDzg47E7DMbOTCS',
          'Alexandra Popa', 'HR_ADMIN', v_dept_hr, 'RO', TRUE)
  ON CONFLICT (email) DO UPDATE SET is_active = TRUE;
  SELECT id INTO v_admin FROM users WHERE email = 'admin@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, preferred_lang, is_active)
  VALUES ('mentor@mail.com',
          '$2b$12$SVZg8qvprToEWc3bq0HSwezbm8Qx9dcHLWNNs/YkKVckQBmROF1xC',
          'Andrei Ionescu', 'MASTER_MENTOR', v_dept_it, 'EN', TRUE)
  ON CONFLICT (email) DO UPDATE SET is_active = TRUE;
  SELECT id INTO v_mentor FROM users WHERE email = 'mentor@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, preferred_lang, is_active)
  VALUES ('user@mail.com',
          '$2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy',
          'Maria Dumitrescu', 'EMPLOYEE', v_dept_ops, 'RO', TRUE)
  ON CONFLICT (email) DO UPDATE SET is_active = TRUE;
  SELECT id INTO v_usr FROM users WHERE email = 'user@mail.com';

  -- Also ensure the default admin from init.sql is active
  UPDATE users SET is_active = TRUE WHERE email = 'admin@edl.com';

  -- ── Content items ─────────────────────────────────────────

  -- 1. Workplace Safety Guidelines (mandatory document)
  v_c1 := uuid_generate_v4();
  INSERT INTO content_items
    (id, title, description, content_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
  VALUES (
    v_c1,
    'Workplace Safety Guidelines',
    'Essential safety rules every employee must know before accessing production areas. Covers PPE requirements, emergency exits, and incident reporting.',
    'DOCUMENT', 'PUBLISHED', TRUE, 'RO',
    v_cat_safety, v_admin, v_admin, NOW()
  );
  INSERT INTO content_documents (content_id, body_html)
  VALUES (v_c1, '<h2>1. Personal Protective Equipment</h2><p>All employees must wear the designated PPE when entering production zones...</p><h2>2. Emergency Procedures</h2><p>In case of fire, activate the nearest alarm and proceed to the assembly point...</p>');
  INSERT INTO content_departments (content_id, department_id) VALUES (v_c1, v_dept_ops), (v_c1, v_dept_mgmt);

  -- 2. New Employee Onboarding Guide (mandatory document)
  v_c2 := uuid_generate_v4();
  INSERT INTO content_items
    (id, title, description, content_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
  VALUES (
    v_c2,
    'New Employee Onboarding Guide',
    'Your first-week companion: company culture, HR policies, benefits overview, and how to get your tools and accesses set up.',
    'DOCUMENT', 'PUBLISHED', TRUE, 'EN',
    v_cat_onboard, v_mentor, v_admin, NOW()
  );
  INSERT INTO content_documents (content_id, body_html)
  VALUES (v_c2, '<h2>Welcome to the Team!</h2><p>We are thrilled to have you on board. This guide will walk you through everything you need for a smooth first week...</p><h2>Benefits</h2><p>Health insurance, meal vouchers, and remote work policy details can be found in the HR portal...</p>');
  INSERT INTO content_departments (content_id, department_id) VALUES (v_c2, v_dept_hr), (v_c2, v_dept_it), (v_c2, v_dept_ops), (v_c2, v_dept_mgmt);

  -- 3. IT Security Best Practices (video)
  v_c3 := uuid_generate_v4();
  INSERT INTO content_items
    (id, title, description, content_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
  VALUES (
    v_c3,
    'IT Security Best Practices',
    'A 12-minute walkthrough of password hygiene, phishing recognition, VPN usage, and data handling policies.',
    'VIDEO', 'PUBLISHED', FALSE, 'EN',
    v_cat_it, v_mentor, v_admin, NOW()
  );
  INSERT INTO content_videos (content_id, video_url, duration_secs, transcript_text)
  VALUES (v_c3, 'https://example.com/videos/it-security.mp4', 720,
          'Welcome to IT Security Best Practices. Today we will cover the four pillars of keeping company data safe...');
  INSERT INTO content_departments (content_id, department_id) VALUES (v_c3, v_dept_it), (v_c3, v_dept_mgmt), (v_c3, v_dept_hr);

  -- 4. CNC Machine Operation Tutorial (video)
  v_c4 := uuid_generate_v4();
  INSERT INTO content_items
    (id, title, description, content_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
  VALUES (
    v_c4,
    'CNC Machine Operation — Line 3',
    'Step-by-step tutorial for operating the CNC machines on production line 3. Includes startup, calibration, and emergency stop procedures.',
    'VIDEO', 'PUBLISHED', TRUE, 'RO',
    v_cat_machine, v_mentor, v_admin, NOW()
  );
  INSERT INTO content_videos (content_id, video_url, duration_secs)
  VALUES (v_c4, 'https://example.com/videos/cnc-line3.mp4', 1440);
  INSERT INTO content_departments (content_id, department_id) VALUES (v_c4, v_dept_ops);

  -- 5. Safety Knowledge Check (quiz)
  v_c5 := uuid_generate_v4();
  INSERT INTO content_items
    (id, title, description, content_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
  VALUES (
    v_c5,
    'Safety Knowledge Check',
    'Short quiz to verify understanding of the Workplace Safety Guidelines. Must be passed with 80% or higher.',
    'QUIZ', 'PUBLISHED', TRUE, 'RO',
    v_cat_safety, v_admin, v_admin, NOW()
  );
  INSERT INTO content_departments (content_id, department_id) VALUES (v_c5, v_dept_ops), (v_c5, v_dept_mgmt);

  -- Quiz questions
  WITH q1 AS (
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_c5, 'What must be worn when entering a production zone?', 'SINGLE_CHOICE', 1)
    RETURNING id
  )
  INSERT INTO quiz_answers (question_id, answer_text, is_correct, position)
  SELECT q1.id,
         unnest(ARRAY['Personal Protective Equipment (PPE)', 'Regular office clothes', 'A hard hat only', 'Nothing specific']),
         unnest(ARRAY[TRUE, FALSE, FALSE, FALSE]),
         unnest(ARRAY[1, 2, 3, 4])
  FROM q1;

  WITH q2 AS (
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_c5, 'Which of the following are valid emergency responses? (Select all that apply)', 'MULTIPLE_CHOICE', 2)
    RETURNING id
  )
  INSERT INTO quiz_answers (question_id, answer_text, is_correct, position)
  SELECT q2.id,
         unnest(ARRAY['Activate the nearest fire alarm', 'Proceed to the assembly point', 'Continue working to finish the task', 'Report the incident to your supervisor']),
         unnest(ARRAY[TRUE, TRUE, FALSE, TRUE]),
         unnest(ARRAY[1, 2, 3, 4])
  FROM q2;

  WITH q3 AS (
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_c5, 'PPE must be inspected before each use.', 'TRUE_FALSE', 3)
    RETURNING id
  )
  INSERT INTO quiz_answers (question_id, answer_text, is_correct, position)
  SELECT q3.id,
         unnest(ARRAY['True', 'False']),
         unnest(ARRAY[TRUE, FALSE]),
         unnest(ARRAY[1, 2])
  FROM q3;

  -- ── Progress / interactions ───────────────────────────────
  INSERT INTO user_content_progress (user_id, content_id, completed, completed_at, progress_pct, last_accessed_at)
  VALUES (v_usr, v_c2, TRUE, NOW() - INTERVAL '2 days', 100, NOW() - INTERVAL '2 days')
  ON CONFLICT (user_id, content_id) DO NOTHING;

  INSERT INTO content_ratings (user_id, content_id, rating)
  VALUES (v_usr, v_c2, 5)
  ON CONFLICT (user_id, content_id) DO NOTHING;

  INSERT INTO content_requests (requester_id, search_term, description, status)
  VALUES (v_usr, 'forklift training', 'We need a forklift operation tutorial for the new hires on the warehouse floor.', 'OPEN');

  RAISE NOTICE 'Seed completed successfully.';
  RAISE NOTICE '  admin@mail.com   / admin123   (HR_ADMIN)';
  RAISE NOTICE '  mentor@mail.com  / mentor123  (MASTER_MENTOR)';
  RAISE NOTICE '  user@mail.com    / user123    (EMPLOYEE)';
END $$;
