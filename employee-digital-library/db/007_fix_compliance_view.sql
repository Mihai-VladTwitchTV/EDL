-- ============================================================
-- Migration 007 — Fix mandatory_compliance_view
--
-- Problem: the view used INNER JOIN content_departments, which
-- excluded mandatory content with no department targeting (the
-- "all departments" case). The feed query handles this correctly
-- with `OR targetDepartments IS EMPTY`; the view now mirrors it.
--
-- Run:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/007_fix_compliance_view.sql
-- ============================================================

CREATE OR REPLACE VIEW mandatory_compliance_view AS
SELECT
    u.id            AS user_id,
    u.full_name,
    u.email,
    d.name          AS department,
    ci.id           AS content_id,
    ci.title        AS content_title,
    ci.created_at   AS published_at,
    ucp.acknowledged,
    ucp.acknowledged_at,
    ucp.completed
FROM content_items ci
-- Cross all active users who belong to a department
JOIN users u ON u.is_active = TRUE AND u.department_id IS NOT NULL
JOIN departments d ON d.id = u.department_id
LEFT JOIN user_content_progress ucp
       ON ucp.content_id = ci.id AND ucp.user_id = u.id
WHERE ci.is_mandatory = TRUE
  AND ci.status = 'PUBLISHED'
  -- Include the user if:
  --   a) the content has no department restrictions (targets everyone), OR
  --   b) the user's department is explicitly targeted
  AND (
      NOT EXISTS (
          SELECT 1 FROM content_departments cd WHERE cd.content_id = ci.id
      )
      OR EXISTS (
          SELECT 1 FROM content_departments cd
          WHERE cd.content_id = ci.id
            AND cd.department_id = u.department_id
      )
  );
