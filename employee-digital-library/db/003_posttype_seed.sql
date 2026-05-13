-- ============================================================
-- Seed 003 — Post-Type Content (NEWS, EVENT, CHANGE, CAREER, REGULATION)
-- Run after seed.sql:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/003_posttype_seed.sql
--
-- Idempotent: checks by title before inserting.
-- ============================================================

DO $$
DECLARE
  v_admin  UUID;
  v_mentor UUID;
  v_dept_hr   UUID;
  v_dept_it   UUID;
  v_dept_ops  UUID;
  v_dept_mgmt UUID;
  v_cat_hr    UUID;
  v_cat_it    UUID;
  v_cat_safety UUID;
  v_id UUID;
BEGIN

  -- Resolve users
  SELECT id INTO v_admin  FROM users WHERE email = 'admin@mail.com';
  SELECT id INTO v_mentor FROM users WHERE email = 'mentor@mail.com';

  -- Resolve departments
  SELECT id INTO v_dept_hr   FROM departments WHERE name = 'HR';
  SELECT id INTO v_dept_it   FROM departments WHERE name = 'IT';
  SELECT id INTO v_dept_ops  FROM departments WHERE name = 'Operations';
  SELECT id INTO v_dept_mgmt FROM departments WHERE name = 'Management';

  -- Resolve categories
  SELECT id INTO v_cat_hr     FROM categories WHERE name = 'HR Policies';
  SELECT id INTO v_cat_it     FROM categories WHERE name = 'IT Guides';
  SELECT id INTO v_cat_safety FROM categories WHERE name = 'Safety Procedures';

  -- ── NEWS ─────────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Q2 Company Results & Roadmap') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'Q2 Company Results & Roadmap',
      'We are pleased to share that Q2 exceeded our production targets by 12%. The Management team presented the H2 roadmap including two new product lines, an expansion of the Operations department, and an upgraded IT infrastructure rollout starting in September.',
      'DOCUMENT', 'NEWS', 'PUBLISHED', FALSE, 'EN',
      v_cat_hr, v_admin, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html)
    VALUES (v_id, '<p>Q2 results summary content.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_hr), (v_id, v_dept_it), (v_id, v_dept_ops), (v_id, v_dept_mgmt);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'New Canteen Menu Starting Monday') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'New Canteen Menu Starting Monday',
      'The company canteen is introducing a new weekly rotating menu with more vegetarian options and a dedicated allergen-free section. The updated menu is available at all meal stations from Monday. Feedback can be submitted through the app.',
      'DOCUMENT', 'NEWS', 'PUBLISHED', FALSE, 'RO',
      v_cat_hr, v_admin, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Canteen menu update details.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_hr), (v_id, v_dept_ops);
  END IF;

  -- ── EVENTS ───────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Annual Health & Safety Day') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, event_date, event_location)
    VALUES (
      v_id,
      'Annual Health & Safety Day',
      'Join us for a full day of workshops, live demonstrations, and expert talks on workplace safety. Topics include first aid, fire safety, ergonomics, and mental health. Attendance is strongly encouraged for all employees.',
      'DOCUMENT', 'EVENT', 'PUBLISHED', FALSE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(),
      NOW() + INTERVAL '14 days',
      'Main Conference Hall, Building A'
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Event details.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_hr), (v_id, v_dept_ops), (v_id, v_dept_mgmt);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'IT Town Hall — Q3 Infrastructure Update') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, event_date, event_location)
    VALUES (
      v_id,
      'IT Town Hall — Q3 Infrastructure Update',
      'The IT department invites all staff to an open Q&A session covering the planned network upgrade, new endpoint management rollout, and the upcoming migration to the new document management system.',
      'DOCUMENT', 'EVENT', 'PUBLISHED', FALSE, 'EN',
      v_cat_it, v_mentor, v_admin, NOW(),
      NOW() + INTERVAL '7 days',
      'Room 204, IT Building / Microsoft Teams'
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>IT Town Hall details.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES (v_id, v_dept_it);
  END IF;

  -- ── CHANGES ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Updated Overtime Request Process') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'Updated Overtime Request Process',
      'Effective immediately, all overtime requests must be submitted via the HR portal at least 48 hours in advance. Verbal approvals are no longer accepted. Direct managers must approve in the system before the work begins. Retroactive requests will only be considered in documented emergencies.',
      'DOCUMENT', 'CHANGE', 'PUBLISHED', TRUE, 'RO',
      v_cat_hr, v_admin, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Overtime process change details.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_hr), (v_id, v_dept_ops), (v_id, v_dept_mgmt);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'New Password Policy — Action Required') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'New Password Policy — Action Required',
      'As part of our ISO 27001 compliance update, all employees must change their domain and HR portal passwords by end of month. Passwords must now be at least 14 characters, include a number and special character, and must not be reused from the last 12 passwords. IT has enabled self-service reset at portal.edl.com/reset.',
      'DOCUMENT', 'CHANGE', 'PUBLISHED', TRUE, 'EN',
      v_cat_it, v_mentor, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Password policy change details.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_it), (v_id, v_dept_hr), (v_id, v_dept_mgmt);
  END IF;

  -- ── CAREERS ──────────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Senior Production Technician') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at,
       job_department, job_location, application_url)
    VALUES (
      v_id,
      'Senior Production Technician',
      'We are looking for an experienced production technician to join Line 3. You will be responsible for operating and maintaining CNC equipment, training junior operators, and participating in quality control checks. 3+ years of CNC experience required.',
      'DOCUMENT', 'CAREER', 'PUBLISHED', FALSE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(),
      'Operations — Line 3', 'Bucharest Factory',
      'https://careers.edl.com/jobs/senior-production-technician'
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Job description details.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES (v_id, v_dept_ops);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Junior IT Support Specialist') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at,
       job_department, job_location, application_url)
    VALUES (
      v_id,
      'Junior IT Support Specialist',
      'The IT department is growing! We are looking for a motivated junior support specialist to handle L1/L2 tickets, assist with hardware setup for new hires, and contribute to our IT asset management system. Fresh graduates are welcome — we provide full onboarding and mentorship.',
      'DOCUMENT', 'CAREER', 'PUBLISHED', FALSE, 'EN',
      v_cat_it, v_mentor, v_admin, NOW(),
      'IT — Support Tehnic', 'Bucharest HQ (Hybrid)',
      'https://careers.edl.com/jobs/junior-it-support'
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Job description details.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES (v_id, v_dept_it);
  END IF;

  -- ── REGULATIONS ──────────────────────────────────────────
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Internal Data Protection Regulation (GDPR Annex)') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'Internal Data Protection Regulation (GDPR Annex)',
      'This regulation defines how all employees must handle personal data of colleagues, customers, and suppliers. Key obligations include: accessing only data necessary for your role, reporting breaches within 1 hour of discovery, and never storing personal data on personal devices. Violations are subject to disciplinary action.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_hr, v_admin, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>GDPR regulation content.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_hr), (v_id, v_dept_it), (v_id, v_dept_ops), (v_id, v_dept_mgmt);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Work Schedule and Break Time Regulation') THEN
    v_id := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language, category_id, author_id, approved_by, approved_at)
    VALUES (
      v_id,
      'Work Schedule and Break Time Regulation',
      'This document outlines the official working hours, mandatory break times, and shift change procedures for all production and office staff. Working hours are 07:00–15:30 for shift A and 15:30–24:00 for shift B. A 30-minute paid break is included. Managers must ensure compliance with these schedules.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_hr, v_admin, v_admin, NOW()
    );
    INSERT INTO content_documents (content_id, body_html) VALUES (v_id, '<p>Work schedule regulation content.</p>');
    INSERT INTO content_departments (content_id, department_id)
    VALUES (v_id, v_dept_ops), (v_id, v_dept_mgmt);
  END IF;

  RAISE NOTICE 'Post-type seed completed: NEWS x2, EVENT x2, CHANGE x2, CAREER x2, REGULATION x2';
END $$;
