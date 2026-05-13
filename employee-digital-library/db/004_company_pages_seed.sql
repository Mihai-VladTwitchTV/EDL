-- ============================================================
-- Seed 004 — Company Pages (About, Policies, Contact)
-- Run after 002_sections_gamification.sql:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/004_company_pages_seed.sql
--
-- Idempotent: uses ON CONFLICT (slug) DO NOTHING.
-- ============================================================

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES
  -- About section
  (uuid_generate_v4(), 'about-company',   'about', 'About Our Company',
   '<h2>About Employee Digital Library</h2><p>The Employee Digital Library (EDL) is the central knowledge hub for our organisation. It brings together training materials, company news, regulatory documents, and career opportunities in one unified platform, accessible from any device.</p><p>EDL was created to ensure every employee has quick access to the information they need to do their job confidently and stay informed about company-wide developments.</p>',
   1, true),

  (uuid_generate_v4(), 'our-mission',     'about', 'Our Mission',
   '<h2>Our Mission</h2><p>We believe that a well-informed workforce is a high-performing workforce. Our mission is to eliminate information silos by making knowledge discoverable, verifiable, and engaging for every team member — from the factory floor to the boardroom.</p><p>We are committed to continuous learning, transparent communication, and a culture where every employee feels empowered by the information available to them.</p>',
   2, true),

  (uuid_generate_v4(), 'our-values',      'about', 'Our Values',
   '<h2>Our Values</h2><ul><li><strong>Transparency</strong> — We share information openly and honestly across all levels of the organisation.</li><li><strong>Growth</strong> — We invest in the continuous development of every employee.</li><li><strong>Integrity</strong> — We hold ourselves accountable to the highest ethical standards.</li><li><strong>Collaboration</strong> — We achieve more together than we ever could alone.</li><li><strong>Safety</strong> — The wellbeing of our people is our first priority, always.</li></ul>',
   3, true),

  -- Policies section
  (uuid_generate_v4(), 'code-of-conduct', 'policies', 'Code of Conduct',
   '<h2>Code of Conduct</h2><p>All employees are expected to behave professionally and with integrity at all times. This includes treating colleagues, customers, and partners with respect, maintaining confidentiality of sensitive information, and avoiding conflicts of interest.</p><p>Violations of the Code of Conduct should be reported to HR via the Support channel in this app or directly to your line manager. All reports are treated with strict confidentiality.</p>',
   1, true),

  (uuid_generate_v4(), 'leave-policy',    'policies', 'Leave Policy',
   '<h2>Leave Policy</h2><p><strong>Annual Leave:</strong> All full-time employees are entitled to 21 working days of annual leave per calendar year. Leave must be approved by your direct manager at least 5 working days in advance.</p><p><strong>Sick Leave:</strong> Up to 3 consecutive sick days may be taken without a medical certificate. Periods longer than 3 days require documentation from a licensed medical practitioner submitted to HR within 48 hours of return.</p><p><strong>Special Leave:</strong> Up to 5 days for personal events (marriage, birth of a child, bereavement). Contact HR for details.</p>',
   2, true),

  (uuid_generate_v4(), 'it-acceptable-use', 'policies', 'IT Acceptable Use Policy',
   '<h2>IT Acceptable Use Policy</h2><p>Company-issued devices and network resources are provided for business purposes. Incidental personal use is permitted provided it does not interfere with your work, consume excessive bandwidth, or violate any other policy.</p><p><strong>Prohibited:</strong> Installing unlicensed software, accessing systems you are not authorised for, sharing credentials, or using company resources for any illegal activity.</p><p><strong>Monitoring:</strong> The company reserves the right to monitor network traffic and device usage for security purposes. Employees have no expectation of privacy on company systems.</p>',
   3, true),

  -- Contact section
  (uuid_generate_v4(), 'contact-hr',      'contact', 'Human Resources',
   '<h2>Human Resources Department</h2><p><strong>Email:</strong> hr@edl.com</p><p><strong>Phone:</strong> +40 21 000 0001 (ext. 101)</p><p><strong>Office:</strong> Building A, Floor 2, Room 201</p><p><strong>Hours:</strong> Monday – Friday, 08:00 – 16:30</p><p>For urgent matters outside office hours, contact the on-call HR duty phone at +40 700 000 001.</p>',
   1, true),

  (uuid_generate_v4(), 'contact-it',      'contact', 'IT Support',
   '<h2>IT Support Desk</h2><p><strong>Email:</strong> it-support@edl.com</p><p><strong>Helpdesk portal:</strong> portal.edl.com/support</p><p><strong>Phone:</strong> +40 21 000 0002 (ext. 102)</p><p><strong>Hours:</strong> Monday – Friday, 07:00 – 22:00 | Saturday, 08:00 – 14:00</p><p>For critical system outages affecting production, use the 24/7 emergency line: +40 700 000 002.</p>',
   2, true),

  (uuid_generate_v4(), 'emergency-contacts', 'contact', 'Emergency Contacts',
   '<h2>Emergency Contacts</h2><p><strong>Fire / Medical Emergency:</strong> 112</p><p><strong>Internal Security:</strong> ext. 999 or +40 21 000 0999</p><p><strong>First Aid Officer (Building A):</strong> ext. 201</p><p><strong>First Aid Officer (Building B):</strong> ext. 301</p><p><strong>Occupational Safety Manager:</strong> safety@edl.com | ext. 105</p><p>Emergency assembly point: Car Park B, north side (yellow markers).</p>',
   3, true)

ON CONFLICT (slug) DO NOTHING;
