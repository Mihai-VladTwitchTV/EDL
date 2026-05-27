-- ============================================================
-- Seed 005 — RO-Logistics & Manufacturing Solutions S.A.
-- Real company data: departments, sections, users, content,
-- quizzes, certifications, company pages.
--
-- Prerequisites (run in order):
--   init.sql
--   002_sections_gamification.sql
--   V6__xp_reward_columns.sql   ← adds xp_reward / xp_bonus_first_attempt
--
-- Run manually:
--   docker exec -i edl_postgres psql -U edl_user -d employee_digital_library < db/006_real_data_seed.sql
--
-- Idempotent: ON CONFLICT DO NOTHING / IF NOT EXISTS throughout.
-- ============================================================

DO $$
DECLARE
  -- departments
  v_dept_prod  UUID;
  v_dept_log   UUID;
  v_dept_qc    UUID;
  v_dept_it    UUID;
  v_dept_hr    UUID;

  -- sections
  v_sec_l3     UUID;
  v_sec_whb    UUID;
  v_sec_qc3    UUID;
  v_sec_global UUID;

  -- categories
  v_cat_safety  UUID;
  v_cat_machine UUID;
  v_cat_hr      UUID;
  v_cat_onboard UUID;
  v_cat_it      UUID;
  v_cat_comp    UUID;
  v_cat_general UUID;

  -- users
  v_admin  UUID;
  v_mentor UUID;
  v_usr1   UUID;
  v_usr2   UUID;
  v_usr3   UUID;
  v_usr4   UUID;

  -- document content ids
  v_doc_ssm      UUID;
  v_doc_gdpr     UUID;
  v_doc_reg      UUID;
  v_doc_onboard  UUID;
  v_doc_support  UUID;
  v_doc_onb_ext  UUID;
  v_doc_maint    UUID;
  v_doc_urgency  UUID;
  v_doc_qc       UUID;
  v_doc_vpn      UUID;
  v_doc_forklift UUID;
  v_doc_evac     UUID;
  v_doc_eip      UUID;
  v_doc_waste    UUID;

  -- video content ids
  v_vid_forklift UUID;
  v_vid_ppe      UUID;
  v_vid_ergo     UUID;
  v_vid_evac     UUID;

  -- quiz content ids
  v_quiz_l3  UUID;
  v_quiz_qc3 UUID;
  v_quiz_vpn UUID;
  v_quiz_whb UUID;
  v_quiz_hse UUID;

  -- quiz question temp id
  v_q UUID;

BEGIN

  -- ── 1. DEPARTMENTS ───────────────────────────────────────
  INSERT INTO departments (name, description) VALUES
    ('Producție',           'Producție industrială și asamblare componente')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO departments (name, description) VALUES
    ('Logistică',           'Managementul lanțului de aprovizionare și distribuție')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO departments (name, description) VALUES
    ('Controlul Calității', 'Inspecție și standarde de calitate ISO')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO departments (name, description) VALUES
    ('IT & Admin',          'Tehnologie informațională, infrastructură și administrație')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO departments (name, description) VALUES
    ('HR',                  'Resurse umane, conformitate și onboarding')
    ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_dept_prod FROM departments WHERE name = 'Producție';
  SELECT id INTO v_dept_log  FROM departments WHERE name = 'Logistică';
  SELECT id INTO v_dept_qc   FROM departments WHERE name = 'Controlul Calității';
  SELECT id INTO v_dept_it   FROM departments WHERE name = 'IT & Admin';
  SELECT id INTO v_dept_hr   FROM departments WHERE name = 'HR';

  -- ── 2. SECTIONS ──────────────────────────────────────────
  INSERT INTO sections (department_id, name, description) VALUES
    (v_dept_prod, 'Linia de Asamblare 3', '30 operatori + Master Mentor')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO sections (department_id, name, description) VALUES
    (v_dept_log, 'Warehouse B', '45 membri – depozit și distribuție')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO sections (department_id, name, description) VALUES
    (v_dept_qc, 'Stația QC 3', '10 inspectori QC – verificare ISO 2026')
    ON CONFLICT (name) DO NOTHING;

  INSERT INTO sections (department_id, name, description) VALUES
    (v_dept_it, 'Global', 'Toți angajații companiei (inclusiv hibrid/remote)')
    ON CONFLICT (name) DO NOTHING;

  SELECT id INTO v_sec_l3     FROM sections WHERE name = 'Linia de Asamblare 3';
  SELECT id INTO v_sec_whb    FROM sections WHERE name = 'Warehouse B';
  SELECT id INTO v_sec_qc3    FROM sections WHERE name = 'Stația QC 3';
  SELECT id INTO v_sec_global FROM sections WHERE name = 'Global';

  -- ── 3. CATEGORIES (resolve existing) ─────────────────────
  SELECT id INTO v_cat_safety  FROM categories WHERE name = 'Safety Procedures';
  SELECT id INTO v_cat_machine FROM categories WHERE name = 'Machine Tutorials';
  SELECT id INTO v_cat_hr      FROM categories WHERE name = 'HR Policies';
  SELECT id INTO v_cat_onboard FROM categories WHERE name = 'Onboarding';
  SELECT id INTO v_cat_it      FROM categories WHERE name = 'IT Guides';
  SELECT id INTO v_cat_comp    FROM categories WHERE name = 'Compliance';
  SELECT id INTO v_cat_general FROM categories WHERE name = 'General';

  -- ── 4. USERS ─────────────────────────────────────────────
  -- Passwords (BCrypt cost 12):
  --   admin123  → $2b$12$G8/k57tg10m7HgC.llCHkuelv0tZUiiHBtXwJrmDzg47E7DMbOTCS
  --   mentor123 → $2b$12$SVZg8qvprToEWc3bq0HSwezbm8Qx9dcHLWNNs/YkKVckQBmROF1xC
  --   user123   → $2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('admin@mail.com',
          '$2b$12$G8/k57tg10m7HgC.llCHkuelv0tZUiiHBtXwJrmDzg47E7DMbOTCS',
          'Alexandra Popa', 'HR_ADMIN', v_dept_hr, NULL, 'RO', TRUE)
  ON CONFLICT (email) DO UPDATE
    SET department_id = v_dept_hr, role = 'HR_ADMIN', is_active = TRUE;
  SELECT id INTO v_admin FROM users WHERE email = 'admin@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('mentor@mail.com',
          '$2b$12$SVZg8qvprToEWc3bq0HSwezbm8Qx9dcHLWNNs/YkKVckQBmROF1xC',
          'Andrei Ionescu', 'MASTER_MENTOR', v_dept_prod, v_sec_l3, 'RO', TRUE)
  ON CONFLICT (email) DO UPDATE
    SET department_id = v_dept_prod, section_id = v_sec_l3, role = 'MASTER_MENTOR', is_active = TRUE;
  SELECT id INTO v_mentor FROM users WHERE email = 'mentor@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('user@mail.com',
          '$2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy',
          'Maria Dumitrescu', 'EMPLOYEE', v_dept_prod, v_sec_l3, 'RO', TRUE)
  ON CONFLICT (email) DO UPDATE
    SET department_id = v_dept_prod, section_id = v_sec_l3, is_active = TRUE;
  SELECT id INTO v_usr1 FROM users WHERE email = 'user@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('user2@mail.com',
          '$2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy',
          'Ion Gheorghe', 'EMPLOYEE', v_dept_log, v_sec_whb, 'RO', TRUE)
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_usr2 FROM users WHERE email = 'user2@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('user3@mail.com',
          '$2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy',
          'Elena Popescu', 'EMPLOYEE', v_dept_qc, v_sec_qc3, 'RO', TRUE)
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_usr3 FROM users WHERE email = 'user3@mail.com';

  INSERT INTO users (email, password_hash, full_name, role, department_id, section_id, preferred_lang, is_active)
  VALUES ('user4@mail.com',
          '$2b$12$C3NsdjGyV3y8aKsfq1DBKOsr2nklFSPEwNnIw/TBFxWwbStoW.Aiy',
          'Radu Marinescu', 'EMPLOYEE', v_dept_it, v_sec_global, 'RO', TRUE)
  ON CONFLICT (email) DO NOTHING;
  SELECT id INTO v_usr4 FROM users WHERE email = 'user4@mail.com';

  UPDATE users SET is_active = TRUE WHERE email = 'admin@edl.com';

  -- ── 5. DOCUMENTS ─────────────────────────────────────────

  -- 5.1 Proceduri SSM și Wellbeing
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Proceduri SSM și Wellbeing') THEN
    v_doc_ssm := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_ssm,
      'Proceduri SSM și Wellbeing',
      'Norme obligatorii de ergonomie, siguranță în producție și protocol de urgență. Acoperă prevenția afecțiunilor, modul Emergency și raportarea incidentelor.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_ssm,
      '<h2>1. Ergonomia și Prevenția Afecțiunilor</h2>
<p><strong>Postura Corectă:</strong> Monitorul trebuie poziționat astfel încât marginea superioară să fie la nivelul ochilor. Scaunul trebuie reglat pentru a susține curbura lombară, menținând unghiul de 90° la nivelul articulațiilor.</p>
<p><strong>Micro-pauze obligatorii:</strong> La fiecare 50 de minute de lucru, aplicația va trimite o notificare de tip „Stretch Break". Ignorarea repetată a acestor recomandări este considerată un risc la adresa sănătății pe termen lung.</p>
<h2>2. Siguranța în Spațiile de Producție și Depozitare</h2>
<p><strong>Instruirea Digitală:</strong> Niciun angajat nu poate opera un utilaj fără a avea „Badge-ul de Certificare" activ în profilul său din aplicație.</p>
<p><strong>Raportarea Incidentelor (Quick-Report):</strong> Orice defect tehnic sesizat trebuie fotografiat și încărcat instantaneu prin modulul „Support IT". Până la primirea confirmării de la un tehnician, zona respectivă va fi marcată ca indisponibilă în harta interactivă a aplicației.</p>
<h2>3. Protocol de Urgență</h2>
<p>În cazul activării alarmei de incendiu, sistemul aplicației intră automat în modul „Emergency Mode". Telefoanele tuturor angajaților logați vor afișa ruta de evacuare dinamică (calculată pe baza ultimei locații de check-in). Punctul de adunare este obligatoriu, iar prezența se face digital prin scanarea QR-codului de la poarta de ieșire.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_ssm, v_dept_prod), (v_doc_ssm, v_dept_log),
      (v_doc_ssm, v_dept_qc),   (v_doc_ssm, v_dept_it), (v_doc_ssm, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_ssm FROM content_items WHERE title = 'Proceduri SSM și Wellbeing';

  -- 5.2 Politica GDPR și Etica Datelor
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Politica GDPR și Etica Datelor') THEN
    v_doc_gdpr := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_gdpr,
      'Politica GDPR și Etica Datelor',
      'Principiile protecției datelor personale, securitatea informației și dreptul la deconectare. Document obligatoriu pentru toți angajații.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_comp, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_gdpr,
      '<h2>1. Principiile Protecției Datelor</h2>
<p>Aplicația procesează date personale strict în scopul îmbunătățirii experienței de învățare și al conformității legale.</p>
<p><strong>Confidențialitatea prin design:</strong> Toate datele de performanță la quiz-uri sunt private. Doar angajatul și managerul direct (sau HR-ul) pot vizualiza progresul, pentru a evita competiția toxică și stresul social.</p>
<h2>2. Securitatea Informației</h2>
<p><strong>Parole și Acces:</strong> Accesul în aplicație este securizat prin Multi-Factor Authentication (MFA). Este strict interzisă partajarea credențialelor.</p>
<p><strong>Politica ecranului curat:</strong> Este interzisă fotografierea ecranului sau extragerea de capturi de ecran cu datele clienților pentru a fi trimise pe platforme externe necriptate (ex. WhatsApp, Facebook).</p>
<h2>3. Dreptul la Deconectare</h2>
<p>Compania respectă dreptul angajatului de a nu fi contactat în afara orelor de program. Aplicația va suspenda notificările non-urgente după ora 18:00, cu excepția situațiilor de forță majoră (alerte SMS).</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_gdpr, v_dept_prod), (v_doc_gdpr, v_dept_log),
      (v_doc_gdpr, v_dept_qc),   (v_doc_gdpr, v_dept_it), (v_doc_gdpr, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_gdpr FROM content_items WHERE title = 'Politica GDPR și Etica Datelor';

  -- 5.3 Regulament Intern 2026
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Regulament Intern 2026') THEN
    v_doc_reg := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_reg,
      'Regulament Intern 2026',
      'Contract de colaborare bazat pe încredere și autonomie. Acoperă programul flexibil (Core Hours 10-16), regimul hibrid 3-2, protocolul de comunicare și beneficiile de învățare Learning Friday.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_hr, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_reg,
      '<h2>1. Dispoziții Generale</h2>
<p>Compania recunoaște că resursa cea mai de preț este capitalul intelectual. Prezentul regulament nu este doar un set de reguli, ci un contract de colaborare bazat pe încredere, autonomie și învățare continuă. Aplicarea acestuia este susținută prin platformă, care devine singura sursă oficială de adevăr procedural.</p>
<h2>2. Filozofia de Lucru și Timpul de Muncă</h2>
<p><strong>2.1. Programul Flexibil:</strong> Intervalul de prezență comună (Core Hours) este 10:00 - 16:00. În afara acestui interval, angajații au libertatea de a-și structura programul, cu condiția îndeplinirii obiectivelor.</p>
<p><strong>2.2. Regimul Hibrid (Modelul 3-2):</strong> Munca de la sediu (3 zile) este dedicată activităților colaborative și mentoratului. Zilele de lucru la distanță (2 zile) sunt destinate activităților de tip „Deep Work".</p>
<h2>3. Protocolul de Comunicare și Feedback</h2>
<p>Orice comunicare tehnică sau procedurală se va desfășura prin intermediul aplicației. Dacă o procedură din sistem este neclară sau depășită, angajatul are datoria morală de a folosi butonul „Feedback" pentru a semnala eroarea.</p>
<h2>4. Drepturi și Beneficii de Învățare</h2>
<p><strong>4.1. „Learning Friday":</strong> Compania alocă 10% din timpul de lucru săptămânal dezvoltării profesionale. În fiecare vineri după ora 14:00, fluxul de emailuri este oprit pentru a permite angajaților să exploreze noi cursuri în Digital Library.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_reg, v_dept_prod), (v_doc_reg, v_dept_log),
      (v_doc_reg, v_dept_qc),   (v_doc_reg, v_dept_it), (v_doc_reg, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_reg FROM content_items WHERE title = 'Regulament Intern 2026';

  -- 5.4 Ghidul Integrat de Onboarding Digital
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Ghidul Integrat de Onboarding Digital') THEN
    v_doc_onboard := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_onboard,
      'Ghidul Integrat de Onboarding Digital',
      'Ghid complet de integrare pentru angajații noi: fluxul de orientare (Zilele 1-3), Matricea de Asimilare a Informației (Săpt. 1-2) și monitorizarea conformității prin Dashboard-ul HR.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_onboard, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_onboard,
      '<h2>1. Introducere și Psihologia Integrării</h2>
<p>Primele zile într-o organizație nouă sunt caracterizate de un nivel ridicat de anxietate generat de incertitudine. Scopul acestui ghid este de a structura procesul de integrare prin aplicație, transformând onboarding-ul dintr-un stres birocratic într-o experiență ghidată și predictibilă.</p>
<h2>2. Faza 0: Fluxul de Orientare în Aplicație (Zilele 1-3)</h2>
<p><strong>Ecranul 1 – Configurația Rolului:</strong> Sistemul confirmă identitatea: „Salut, [Nume]! Te-ai alăturat echipei din X."</p>
<p><strong>Ecranul 2 – Harta Cunoașterii:</strong> O animație scurtă indică unde se află documentele obligatorii (Secțiunea Mandatory) și unde se poate solicita ajutor (Secțiunea Ask a Mentor).</p>
<p><strong>Ecranul 3 – Primul tău succes:</strong> Utilizatorul este invitat să parcurgă un video de bun venit de 60 de secunde de la CEO, primind primele 10 puncte XP.</p>
<h2>3. Faza 1: Matricea de Asimilare a Informației (Săptămânile 1-2)</h2>
<p>Feed-ul angajatului va fi prioritizat algoritmic cu câte o „pastilă de cunoaștere" zilnică (Micro-learning): Luni – Politica Hibrid; Marți – Ghidul Ergonomiei; Miercuri – Securitatea digitală și GDPR.</p>
<h2>4. Monitorizarea Conformității</h2>
<p>Managerul și HR nu vor presa angajatul cu telefoane. Ei vor urmări progresul pasiv prin Dashboard-ul de conformitate. Dacă un angajat nou nu a bifat „Am luat la cunoștință" pentru normele SSM în primele 5 zile, sistemul va trimite o alertă galbenă exclusiv în interiorul orelor de program (08:00 - 18:00).</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_onboard, v_dept_prod), (v_doc_onboard, v_dept_log),
      (v_doc_onboard, v_dept_qc),   (v_doc_onboard, v_dept_it), (v_doc_onboard, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_onboard FROM content_items WHERE title = 'Ghidul Integrat de Onboarding Digital';

  -- 5.5 Protocolul de Support și Accesibilitate IT & HR
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Protocolul de Support și Accesibilitate IT & HR') THEN
    v_doc_support := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_support,
      'Protocolul de Support și Accesibilitate IT & HR',
      'Matricea de direcționare a solicitărilor pe trei niveluri de urgență: Support IT (it-support@companie.ro, SLA < 2h), Support HR (hr@companie.ro, SLA < 24h) și Urgențe (emergency@companie.ro).',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', FALSE, 'RO',
      v_cat_it, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_support,
      '<h2>1. Reducerea Timpului de Rezolvare</h2>
<p>Sistemul de suport din Digital Library este conceput pe trei niveluri de urgență pentru a preveni blocajele operaționale și stresul frustrării tehnice.</p>
<h2>2. Matricea de Direcționare a Solicitărilor</h2>
<table>
<tr><th>Categorie</th><th>Responsabilitate</th><th>Canal Oficial</th><th>SLA</th></tr>
<tr><td>Support IT</td><td>Resetare credențiale, erori aplicație, probleme VPN, defecțiuni hardware</td><td><a href="mailto:it-support@companie.ro">it-support@companie.ro</a> / Modul Ticketing</td><td>&lt; 2 ore pentru urgențe de acces</td></tr>
<tr><td>Support HR</td><td>Managementul concediilor, clarificări salariale, adeverințe, onboarding</td><td><a href="mailto:hr@companie.ro">hr@companie.ro</a> / Formular Online</td><td>&lt; 24 ore</td></tr>
<tr><td>Urgențe (SMS)</td><td>Incidente critice, breșe de securitate, alerte medicale</td><td>Butonul „Emergency" / <a href="mailto:emergency@companie.ro">emergency@companie.ro</a></td><td>Imediat</td></tr>
</table>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_support, v_dept_prod), (v_doc_support, v_dept_log),
      (v_doc_support, v_dept_qc),   (v_doc_support, v_dept_it), (v_doc_support, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_support FROM content_items WHERE title = 'Protocolul de Support și Accesibilitate IT & HR';

  -- 5.6 Ghid de Onboarding (link extern Google Docs)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Ghid de Onboarding – Document extern') THEN
    v_doc_onb_ext := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_onb_ext,
      'Ghid de Onboarding – Document extern',
      'Versiunea completă a ghidului de onboarding, disponibilă în Google Docs pentru consultare și comentarii.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', FALSE, 'RO',
      v_cat_onboard, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html, file_url) VALUES (v_doc_onb_ext,
      '<p>Accesați documentul complet de onboarding prin linkul atașat.</p>',
      'https://docs.google.com/document/d/1-hBsyMFJKP748LCNqWSCvHcIol6hvKLTm7VMwGMOEeY/edit?usp=sharing');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_onb_ext, v_dept_prod), (v_doc_onb_ext, v_dept_log),
      (v_doc_onb_ext, v_dept_qc),   (v_doc_onb_ext, v_dept_it), (v_doc_onb_ext, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_onb_ext FROM content_items WHERE title = 'Ghid de Onboarding – Document extern';

  -- 5.7 Procedura de mentenanță preventivă – Linia 3
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Procedura de mentenanță preventivă – Linia 3') THEN
    v_doc_maint := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_maint,
      'Procedura de mentenanță preventivă – Linia 3',
      'Protocol de verificare zilnică pentru operatorii Liniei de Asamblare 3: inspecție vizuală, lubrifiere, senzori de presiune (zona verde 0.5–0.8 bar) și curățare. Obligatoriu înainte de pornirea schimbului.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_machine, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_maint,
      '<h2>Protocol de verificare zilnică</h2>
<p>Pentru a preveni defecțiunile majore și a asigura siguranța operatorilor, urmați acești pași în fiecare dimineață:</p>
<ol>
<li><strong>Inspecție vizuală:</strong> Verificați dacă există scurgeri de lichid sau componente desfăcute la utilajul X.</li>
<li><strong>Lubrifiere:</strong> Aplicați lubrifiant conform marcajelor <strong>albastre</strong> de pe axul principal.</li>
<li><strong>Senzori de presiune:</strong> Verificați cadranul de control; acul trebuie să fie în zona verde (<strong>0.5 - 0.8 bar</strong>).</li>
<li><strong>Curățare:</strong> Îndepărtați resturile metalice din zona benzii transportoare folosind <strong>doar pensula dedicată</strong>.</li>
</ol>
<p>După parcurgere, apăsați butonul „Am luat la cunoștință" pentru raportul de conformitate.</p>
<h2>Reguli de Siguranță</h2>
<p>Este strict interzisă intervenția asupra utilajelor aflate în funcțiune sau demontarea carcaselor de protecție fără autorizație de mentenanță. Personalul de pe Linia 3 trebuie să utilizeze <strong>protecție auditivă</strong> în zonele unde zgomotul depășește pragul de <strong>85 dB</strong> și <strong>ochelari de protecție</strong> pentru a preveni incidentele cauzate de particule metalice.</p>');
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_doc_maint, v_dept_prod, v_sec_l3)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_maint FROM content_items WHERE title = 'Procedura de mentenanță preventivă – Linia 3';

  -- 5.8 Protocol de oprire de urgență și raportare
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Protocol de oprire de urgență și raportare') THEN
    v_doc_urgency := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_urgency,
      'Protocol de oprire de urgență și raportare',
      'Procedura în caz de pericol iminent (fum, sunet anormal, risc de accidentare): apăsarea butonului roșu „Ciupercă", contactarea Master Mentorului și așteptarea aprobării tehnice înainte de repornire.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_urgency,
      '<h2>Procedură în caz de pericol iminent</h2>
<p>În cazul unui sunet anormal, fum sau pericol de accidentare:</p>
<ol>
<li>Apăsați imediat butonul roșu de tip <strong>„Ciupercă"</strong> aflat la capătul Liniei 3.</li>
<li>Nu încercați să remediați defecțiunea mecanică singuri.</li>
<li>Contactați imediat Master Mentorul secției prin secțiunea <strong>„Support"</strong> a aplicației sau direct la stația radio.</li>
<li>Așteptați aprobarea tehnică înainte de repornire.</li>
</ol>
<p><strong>Nerespectarea acestui protocol atrage proceduri disciplinare conform Regulamentului Intern.</strong></p>');
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_doc_urgency, v_dept_prod, v_sec_l3)
    ON CONFLICT (content_id, department_id) DO NOTHING;
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_urgency, v_dept_log), (v_doc_urgency, v_dept_qc),
      (v_doc_urgency, v_dept_it),  (v_doc_urgency, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_urgency FROM content_items WHERE title = 'Protocol de oprire de urgență și raportare';

  -- 5.9 Controlul calității: standarde ISO 2026
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Controlul calității: standarde ISO 2026') THEN
    v_doc_qc := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_qc,
      'Controlul calității: standarde ISO 2026',
      'Noii parametri de precizie pentru componentele asamblate: formula T = (0.02 * D) + 0.015, verificare cu micrometrul digital (calibrare săptămânală), trei măsurători per piesă și raportare la depășirea a 5 piese consecutive respinse.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_general, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_qc,
      '<h2>Standarde de Producție și Calcul</h2>
<p>Toate componentele verificate la stația QC 3 trebuie să respecte noile marje de eroare conform normelor ISO 2026.</p>
<p><strong>Formula toleranței:</strong> <code>T = (0.02 × D) + 0.015</code>, unde T = toleranța totală (mm) și D = diametrul nominal al piesei.</p>
<h2>Instrucțiuni de Verificare</h2>
<p>Procesul de verificare se realizează exclusiv cu <strong>micrometrul digital</strong> din dotare, care necesită o <strong>calibrare săptămânală</strong> riguroasă. Pentru fiecare piesă din eșantion, operatorul va efectua <strong>trei măsurători în puncte diferite</strong>. Dacă valoarea măsurată depășește pragul T, piesa va fi clasificată imediat ca <strong>„Respinsă"</strong> și va fi izolată în containerul roșu dedicat neconformităților.</p>
<h2>Raportarea Erorilor Sistematice</h2>
<p>Orice abatere sistematică — definită prin respingerea a <strong>mai mult de 5 piese consecutive</strong> — trebuie raportată fără întârziere prin funcția <strong>Support (Technical)</strong> din aplicație pentru a permite intervenția echipelor de mentenanță.</p>');
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_doc_qc, v_dept_qc, v_sec_qc3)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_qc FROM content_items WHERE title = 'Controlul calității: standarde ISO 2026';

  -- 5.10 Ghid tehnic – Acces securizat VPN și politica de parole
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Ghid tehnic – Acces securizat VPN și politica de parole') THEN
    v_doc_vpn := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_vpn,
      'Ghid tehnic – Acces securizat VPN și politica de parole',
      'Instrucțiuni pentru conectarea securizată prin VPN (SSO + MFA), politica de parole (min. 12 caractere, schimbare la 90 zile, fără reciclarea ultimelor 5) și măsuri de securitate fizică la stația de lucru.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', FALSE, 'RO',
      v_cat_it, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_vpn,
      '<h2>Acces Securizat prin VPN</h2>
<p>Toți angajații care lucrează în regim hibrid sau de acasă trebuie să utilizeze conexiunea VPN oficială. Pașii obligatorii:</p>
<ol>
<li>Deschideți clientul VPN instalat pe laptopul de serviciu și selectați serverul regional corespunzător locației dumneavoastră.</li>
<li>Autentificați-vă folosind credențialele <strong>SSO (Single Sign-On)</strong>.</li>
<li>Confirmați identitatea prin <strong>aplicația MFA</strong> de pe dispozitivul mobil.</li>
</ol>
<h2>Politica de Parole</h2>
<p>Fiecare parolă trebuie să aibă o <strong>lungime minimă de 12 caractere</strong> și să includă obligatoriu litere mari, litere mici, cifre și cel puțin un caracter special. Este strict interzisă utilizarea informațiilor personale ușor de identificat. Sistemul va solicita automat schimbarea parolei la fiecare <strong>90 de zile</strong>, iar <strong>ultimele 5 parole</strong> nu pot fi reutilizate.</p>
<h2>Securitate Fizică și Electrică</h2>
<p>Monitorul trebuie poziționat la nivelul ochilor. Echipamentele IT se conectează doar în prize cu împământare. Ecranul trebuie blocat la orice părăsire a postului de lucru.</p>
<h2>Suport</h2>
<p>În caz de dificultăți tehnice sau parolă compromisă, deschideți un tichet prin secțiunea „Support" din aplicație sau contactați direct IT la <a href="mailto:it-support@companie.ro">it-support@companie.ro</a>.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_vpn, v_dept_prod), (v_doc_vpn, v_dept_log),
      (v_doc_vpn, v_dept_qc),   (v_doc_vpn, v_dept_it), (v_doc_vpn, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_vpn FROM content_items WHERE title = 'Ghid tehnic – Acces securizat VPN și politica de parole';

  -- 5.11 Siguranța utilizării motostivuitorului – Warehouse B
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Siguranța utilizării motostivuitorului – Warehouse B') THEN
    v_doc_forklift := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_forklift,
      'Siguranța utilizării motostivuitorului – Warehouse B',
      'Ghid obligatoriu pentru cei 45 de membri ai secției Warehouse B: inspecția bateriei, reguli de circulație (prioritate pietoni), regula priorității de dreapta, limita de 20 kg pentru manipulare manuală.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_forklift,
      '<h2>Inspecția înainte de schimb</h2>
<p>Înainte de începerea fiecărui schimb, operatorii trebuie să efectueze o inspecție vizuală a bateriei motostivuitorului, verificând <strong>integritatea conectorilor</strong> și <strong>absența oricăror scurgeri de lichid coroziv</strong>.</p>
<h2>Reguli de Circulație în Warehouse B</h2>
<ul>
<li><strong>Pietonii au prioritate absolută</strong> în toate zonele de lucru.</li>
<li>La fiecare intersecție: reduceți viteza, utilizați semnalul sonor (claxon) și aplicați <strong>regula priorității de dreapta</strong>, cu excepția zonelor marcate cu indicatoare de stop.</li>
<li>Mențineți o distanță de siguranță de minimum <strong>2 metri</strong> față de orice utilaj în mișcare.</li>
</ul>
<h2>Manipularea Sarcinilor</h2>
<p>Sarcinile ce depășesc <strong>20 kg</strong> trebuie manipulate exclusiv cu ajutorul echipamentelor mecanice sau în echipă. Orice scurgere de lichid sau palet instabil trebuie raportată imediat prin secțiunea Support a aplicației.</p>
<p>După parcurgerea integrală a acestor instrucțiuni, apăsați butonul <strong>„Am luat la cunoștință"</strong>. Aceasta va transmite automat raportul de conformitate către HR și va actualiza punctajul XP în leaderboard.</p>');
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_doc_forklift, v_dept_log, v_sec_whb)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_forklift FROM content_items WHERE title = 'Siguranța utilizării motostivuitorului – Warehouse B';

  -- 5.12 Procedura de evacuare în situații de urgență
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Procedura de evacuare în situații de urgență') THEN
    v_doc_evac := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_evac,
      'Procedura de evacuare în situații de urgență',
      'Pași obligatorii la declanșarea alarmei: întreruperea activității, oprirea utilajelor, evacuarea pe ieșirile de urgență (fără lift), prezența la punctul de adunare verificată de Mentor prin profilul digital.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_evac,
      '<h2>Procedura de Evacuare</h2>
<p>Siguranța în situații de criză (incendii, cutremure, dezastre naturale) depinde de o reacție rapidă și coordonată a întregului personal.</p>
<h3>La declanșarea alarmei:</h3>
<ol>
<li><strong>Întrerupeți imediat activitatea</strong> și opriți utilajele conform protocolului de siguranță.</li>
<li>Îndreptați-vă către cea mai apropiată <strong>ieșire de urgență marcată vizibil</strong>.</li>
<li>Este <strong>strict interzisă</strong> utilizarea lifturilor sau oprirea pentru recuperarea obiectelor personale.</li>
<li>Ajungeți la <strong>punctul de adunare</strong> specific secției dumneavoastră.</li>
</ol>
<p>Mentorul fiecărei secții are responsabilitatea de a efectua prezența la punctul de adunare, utilizând datele din profilul utilizatorului din aplicație, pentru a se asigura că nimeni nu a rămas în incintă.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_evac, v_dept_prod), (v_doc_evac, v_dept_log),
      (v_doc_evac, v_dept_qc),   (v_doc_evac, v_dept_it), (v_doc_evac, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_evac FROM content_items WHERE title = 'Procedura de evacuare în situații de urgență';

  -- 5.13 Ghid EIP – Echipament Individual de Protecție
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Ghid EIP – Echipament Individual de Protecție') THEN
    v_doc_eip := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_eip,
      'Ghid EIP – Echipament Individual de Protecție',
      'Standardele de protecție personalizate pe zone: Linia 3 (încălțăminte antistatică + ochelari), Warehouse B (veste reflectorizante + bocanci cu bombeu metalic). Finalizarea quiz-ului deblochează certificări digitale.',
      'DOCUMENT', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_eip,
      '<h2>Echipament Individual de Protecție pe Zone</h2>
<p>Menținerea unui mediu de lucru sigur necesită respectarea riguroasă a standardelor EIP, personalizate în funcție de riscurile specifice fiecărei zone:</p>
<ul>
<li><strong>Linia de Asamblare 3:</strong> Încălțăminte antistatică și ochelari de protecție (obligatorii împotriva particulelor metalice).</li>
<li><strong>Warehouse B:</strong> Veste reflectorizante și bocanci cu bombeu metalic pentru manipularea motostivuitoarelor.</li>
</ul>
<p>Angajații trebuie să finalizeze Quiz-ul de verificare EIP pentru a demonstra înțelegerea corectă a utilizării fiecărui element de siguranță. Validarea cunoștințelor deblochează <strong>certificări digitale</strong> în profilul angajatului și contribuie la acumularea de XP.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_eip, v_dept_prod), (v_doc_eip, v_dept_log),
      (v_doc_eip, v_dept_qc),   (v_doc_eip, v_dept_it), (v_doc_eip, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_eip FROM content_items WHERE title = 'Ghid EIP – Echipament Individual de Protecție';

  -- 5.14 Managementul deșeurilor și protecția mediului
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Managementul deșeurilor și protecția mediului') THEN
    v_doc_waste := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_doc_waste,
      'Managementul deșeurilor și protecția mediului',
      'Procedura de colectare selectivă: deșeurile periculoase (chimicale, uleiuri industriale, componente electronice) se depozitează exclusiv în containere etanșe, etichetate, în zonele de colectare dedicate din fiecare departament.',
      'DOCUMENT', 'REGULATION', 'PUBLISHED', FALSE, 'RO',
      v_cat_comp, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_documents (content_id, body_html) VALUES (v_doc_waste,
      '<h2>Colectare Selectivă și Gestionarea Deșeurilor Periculoase</h2>
<p>Procedura de colectare selectivă impune separarea strictă a deșeurilor periculoase — substanțe chimice, uleiuri industriale sau componente electronice — care trebuie depozitate exclusiv în <strong>containere etanșe, etichetate corespunzător</strong> și plasate în zonele de colectare dedicate din fiecare departament.</p>
<p>Documentele care descriu aceste procese pot fi găsite în secțiunea <strong>Regulations</strong> a aplicației, unde angajații trebuie să folosească butonul „Am luat la cunoștință" pentru a confirma înțelegerea modului corect de eliminare a deșeurilor.</p>
<p>HR Admin-ul monitorizează aceste rate de conformitate prin dashboard-ul de administrare, asigurându-se că întreaga organizație menține un impact minim asupra mediului înconjurător.</p>');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_doc_waste, v_dept_prod), (v_doc_waste, v_dept_log),
      (v_doc_waste, v_dept_qc),   (v_doc_waste, v_dept_it), (v_doc_waste, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_doc_waste FROM content_items WHERE title = 'Managementul deșeurilor și protecția mediului';

  -- ── 6. VIDEOS ─────────────────────────────────────────────

  -- 6.1 Forklift Safety
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Siguranța utilizării motostivuitorului – Video') THEN
    v_vid_forklift := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_vid_forklift,
      'Siguranța utilizării motostivuitorului – Video',
      'Tutorial video complet despre operarea în siguranță a motostivuitorului în mediul de depozit.',
      'VIDEO', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_machine, v_mentor, v_admin, NOW(), 10, 0);
    INSERT INTO content_videos (content_id, video_url) VALUES
      (v_vid_forklift, 'https://youtu.be/FmHMeVTeaF4');
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_vid_forklift, v_dept_log, v_sec_whb)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_vid_forklift FROM content_items WHERE title = 'Siguranța utilizării motostivuitorului – Video';

  -- 6.2 PPE Safety
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Echipament Individual de Protecție (PPE) – Video') THEN
    v_vid_ppe := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_vid_ppe,
      'Echipament Individual de Protecție (PPE) – Video',
      'Training video despre utilizarea corectă a echipamentului individual de protecție în mediul industrial.',
      'VIDEO', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_videos (content_id, video_url) VALUES
      (v_vid_ppe, 'https://youtu.be/NV2cNmfK8_Y');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_vid_ppe, v_dept_prod), (v_vid_ppe, v_dept_log),
      (v_vid_ppe, v_dept_qc),   (v_vid_ppe, v_dept_it), (v_vid_ppe, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_vid_ppe FROM content_items WHERE title = 'Echipament Individual de Protecție (PPE) – Video';

  -- 6.3 Office Ergonomics
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Ergonomia la birou – Video') THEN
    v_vid_ergo := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_vid_ergo,
      'Ergonomia la birou – Video',
      'Ghid video despre postura corectă, poziționarea monitorului și prevenirea afecțiunilor musculo-scheletice la birou.',
      'VIDEO', 'TRAINING', 'PUBLISHED', FALSE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_videos (content_id, video_url) VALUES
      (v_vid_ergo, 'https://youtu.be/riD8Xt8r1MQ');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_vid_ergo, v_dept_prod), (v_vid_ergo, v_dept_log),
      (v_vid_ergo, v_dept_qc),   (v_vid_ergo, v_dept_it), (v_vid_ergo, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_vid_ergo FROM content_items WHERE title = 'Ergonomia la birou – Video';

  -- 6.4 Emergency Evacuation
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Evacuare în caz de incendiu – Video') THEN
    v_vid_evac := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_vid_evac,
      'Evacuare în caz de incendiu – Video',
      'Training video pentru procedura de evacuare în caz de incendiu: alarmă, rute de ieșire, punct de adunare.',
      'VIDEO', 'REGULATION', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 10, 0);
    INSERT INTO content_videos (content_id, video_url) VALUES
      (v_vid_evac, 'https://youtu.be/TFGDJwwziAU');
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_vid_evac, v_dept_prod), (v_vid_evac, v_dept_log),
      (v_vid_evac, v_dept_qc),   (v_vid_evac, v_dept_it), (v_vid_evac, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;
  END IF;
  SELECT id INTO v_vid_evac FROM content_items WHERE title = 'Evacuare în caz de incendiu – Video';

  -- ── 7. QUIZZES ────────────────────────────────────────────

  -- 7.1 Safety Knowledge Check – Linia 3 (pass_threshold=100)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Safety Knowledge Check – Linia 3') THEN
    v_quiz_l3 := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_quiz_l3,
      'Safety Knowledge Check – Linia 3',
      'Verificarea cunoștințelor de siguranță pentru operatorii Liniei de Asamblare 3. Prag de trecere: 100%. Recompensă: 50 XP + Certificat „Safety First".',
      'QUIZ', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_mentor, v_admin, NOW(), 50, 15);
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_quiz_l3, v_dept_prod, v_sec_l3)
    ON CONFLICT (content_id, department_id) DO NOTHING;

    -- Q1
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_l3, 'Care este intervalul de presiune indicat de „zona verde" pe cadranul de control?', 'SINGLE_CHOICE', 1)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, '0.2 - 0.5 bar', FALSE, 1),
      (v_q, '0.5 - 0.8 bar', TRUE,  2),
      (v_q, '0.8 - 1.2 bar', FALSE, 3);

    -- Q2
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_l3, 'Ce culoare au marcajele de pe axul principal unde trebuie aplicat lubrifiantul?', 'SINGLE_CHOICE', 2)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Roșu',   FALSE, 1),
      (v_q, 'Albastru', TRUE, 2),
      (v_q, 'Galben', FALSE, 3);

    -- Q3
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_l3, 'Ce instrument este permis pentru îndepărtarea resturilor metalice de pe banda transportoare?', 'SINGLE_CHOICE', 3)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Jet de aer comprimat',              FALSE, 1),
      (v_q, 'Doar pensula dedicată',              TRUE,  2),
      (v_q, 'Mâna (cu mănușă de protecție)', FALSE, 3);

    -- Q4
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_l3, 'În cazul unui pericol iminent (fum/sunet anormal), care este prima acțiune obligatorie?', 'SINGLE_CHOICE', 4)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Apăsarea butonului roșu de tip „Ciupercă"',         TRUE,  1),
      (v_q, 'Încercarea de a remedia defecțiunea mecanică',       FALSE, 2),
      (v_q, 'Raportarea în aplicație înainte de a opri utilajul', FALSE, 3);

    -- Q5
    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_l3, 'Peste ce prag de zgomot devine obligatorie purtarea protecției auditive?', 'SINGLE_CHOICE', 5)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, '75 dB', FALSE, 1),
      (v_q, '80 dB', FALSE, 2),
      (v_q, '85 dB', TRUE,  3);
  END IF;
  SELECT id INTO v_quiz_l3 FROM content_items WHERE title = 'Safety Knowledge Check – Linia 3';

  -- 7.2 Test de verificare: Standarde QC 3 (pass_threshold=80)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Test de verificare: Standarde QC 3') THEN
    v_quiz_qc3 := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_quiz_qc3,
      'Test de verificare: Standarde QC 3',
      'Verificarea cunoașterii standardelor ISO 2026 pentru personalul de la Stația QC 3. Prag de trecere: 80%. Recompensă: 50 XP.',
      'QUIZ', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_general, v_mentor, v_admin, NOW(), 50, 15);
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_quiz_qc3, v_dept_qc, v_sec_qc3)
    ON CONFLICT (content_id, department_id) DO NOTHING;

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_qc3, 'Care este formula corectă pentru calcularea toleranței totale (T)?', 'SINGLE_CHOICE', 1)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'T = (0.2 * D) + 0.15',   FALSE, 1),
      (v_q, 'T = (0.02 * D) + 0.015', TRUE,  2),
      (v_q, 'T = (0.015 * D) + 0.02', FALSE, 3),
      (v_q, 'T = D / 0.02 + 0.015',   FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_qc3, 'Ce instrument trebuie utilizat pentru procesul de verificare a pieselor?', 'SINGLE_CHOICE', 2)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Șublerul digital cu calibrare zilnică',            FALSE, 1),
      (v_q, 'Micrometrul analogic din dotarea stației',          FALSE, 2),
      (v_q, 'Micrometrul digital cu calibrare săptămânală',      TRUE,  3),
      (v_q, 'Senzorul laser de pe linia de asamblare',           FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_qc3, 'Cum se procedează corect pentru măsurarea unei piese din eșantion?', 'SINGLE_CHOICE', 3)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Se efectuează o singură măsurătoare în centrul piesei',                FALSE, 1),
      (v_q, 'Se efectuează două măsurători la ambele capete',                       FALSE, 2),
      (v_q, 'Se efectuează trei măsurători în puncte diferite',                     TRUE,  3),
      (v_q, 'Se măsoară piesa până când se obține o valoare sub pragul T',          FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_qc3, 'Ce acțiune este obligatorie în cazul în care o piesă depășește pragul de toleranță T?', 'SINGLE_CHOICE', 4)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Piesa este trimisă la recondiționare imediată',                              FALSE, 1),
      (v_q, 'Piesa este clasificată ca „Respinsă" și izolată în containerul roșu',        TRUE,  2),
      (v_q, 'Se repetă măsurătoarea de 5 ori pentru confirmare',                          FALSE, 3),
      (v_q, 'Piesa este lăsată pe banda de producție cu un marcaj special',               FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_qc3, 'Când este considerată o abatere ca fiind „sistematică" și raportată la Support Technical?', 'SINGLE_CHOICE', 5)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Când eroarea de măsurare depășește 1 mm',                       FALSE, 1),
      (v_q, 'Când sunt respinse mai mult de 3 piese în total pe schimb',     FALSE, 2),
      (v_q, 'Când micrometrul nu a fost calibrat la timp',                   FALSE, 3),
      (v_q, 'Când sunt respinse mai mult de 5 piese consecutive',            TRUE,  4);
  END IF;
  SELECT id INTO v_quiz_qc3 FROM content_items WHERE title = 'Test de verificare: Standarde QC 3';

  -- 7.3 Test de verificare: Acces VPN și politica de parole (pass_threshold=80)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Test de verificare: Acces VPN și politica de parole') THEN
    v_quiz_vpn := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_quiz_vpn,
      'Test de verificare: Acces VPN și politica de parole',
      'Verificarea cunoașterii procedurilor de securitate digitală: autentificare VPN, politica de parole și măsuri fizice la stația de lucru. Prag de trecere: 80%.',
      'QUIZ', 'TRAINING', 'PUBLISHED', FALSE, 'RO',
      v_cat_it, v_mentor, v_admin, NOW(), 50, 15);
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_quiz_vpn, v_dept_prod), (v_quiz_vpn, v_dept_log),
      (v_quiz_vpn, v_dept_qc),   (v_quiz_vpn, v_dept_it), (v_quiz_vpn, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_vpn, 'Care sunt pașii obligatorii pentru o autentificare securizată prin VPN?', 'SINGLE_CHOICE', 1)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Introducerea numelui de utilizator și a unei parole din 8 caractere',         FALSE, 1),
      (v_q, 'Selectarea serverului regional și introducerea codului primit prin SMS',       FALSE, 2),
      (v_q, 'Utilizarea credențialelor SSO și confirmarea identității prin aplicația MFA',  TRUE,  3),
      (v_q, 'Conectarea automată la rețeaua Wi-Fi a locației de domiciliu',                 FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_vpn, 'Conform politicii companiei, care este configurația minimă acceptată pentru o parolă?', 'SINGLE_CHOICE', 2)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Minim 8 caractere, litere și cifre',                                                        FALSE, 1),
      (v_q, 'Minim 12 caractere, incluzând litere mari, mici, cifre și un caracter special',             TRUE,  2),
      (v_q, 'Minim 10 caractere, fără a folosi caractere speciale pentru a evita erorile',               FALSE, 3),
      (v_q, 'Orice lungime, atât timp cât nu conține numele membrilor familiei',                          FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_vpn, 'Ce regulă se aplică în cazul schimbării și reciclării parolelor?', 'SINGLE_CHOICE', 3)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Parola trebuie schimbată anual și poate fi identică cu cea precedentă',                         FALSE, 1),
      (v_q, 'Parola se schimbă la 60 de zile și nu pot fi folosite ultimele 3 parole',                       FALSE, 2),
      (v_q, 'Parola se schimbă automat la 90 de zile și nu pot fi reciclate ultimele 5 parole',              TRUE,  3),
      (v_q, 'Parola se schimbă doar dacă utilizatorul suspectează un atac cibernetic',                       FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_vpn, 'Ce măsuri de siguranță fizică și electrică trebuie respectate la stația de lucru?', 'SINGLE_CHOICE', 4)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Conectarea laptopului la orice sursă de curent disponibilă în cameră',                                  FALSE, 1),
      (v_q, 'Utilizarea unui monitor poziționat cât mai jos pentru a relaxa gâtul',                                  FALSE, 2),
      (v_q, 'Utilizarea prizelor cu împământare și poziționarea monitorului la nivelul ochilor',                     TRUE,  3),
      (v_q, 'Supraîncărcarea prelungitoarelor pentru a centraliza toate echipamentele',                              FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_vpn, 'Cum trebuie procedat în cazul în care suspectați compromiterea parolei personale?', 'SINGLE_CHOICE', 5)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Se așteaptă expirarea celor 90 de zile pentru schimbarea automată',                          FALSE, 1),
      (v_q, 'Se deschide imediat un tichet prin secțiunea „Support" din Employee Digital Library',        TRUE,  2),
      (v_q, 'Se anunță colegii de echipă prin mesageria internă neoficială',                              FALSE, 3),
      (v_q, 'Se resetează routerul de acasă pentru a schimba adresa IP',                                  FALSE, 4);
  END IF;
  SELECT id INTO v_quiz_vpn FROM content_items WHERE title = 'Test de verificare: Acces VPN și politica de parole';

  -- 7.4 Test de verificare: Siguranța motostivuitorului – WHB (pass_threshold=80)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Test de verificare: Siguranța motostivuitorului – WHB') THEN
    v_quiz_whb := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_quiz_whb,
      'Test de verificare: Siguranța motostivuitorului – WHB',
      'Verificarea cunoașterii regulilor de siguranță pentru operatorii din Warehouse B. Prag de trecere: 80%. Recompensă: 50 XP.',
      'QUIZ', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_mentor, v_admin, NOW(), 50, 15);
    INSERT INTO content_departments (content_id, department_id, section_id) VALUES
      (v_quiz_whb, v_dept_log, v_sec_whb)
    ON CONFLICT (content_id, department_id) DO NOTHING;

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_whb, 'Ce verificare obligatorie trebuie efectuată la baterie înainte de începerea schimbului?', 'SINGLE_CHOICE', 1)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Verificarea nivelului de încărcare pentru autonomie maximă',                         FALSE, 1),
      (v_q, 'Curățarea prafului de pe suprafața exterioară a utilajului',                         FALSE, 2),
      (v_q, 'Inspectarea conectorilor și verificarea absenței scurgerilor de lichid coroziv',     TRUE,  3),
      (v_q, 'Măsurarea temperaturii bateriei cu un termometru digital',                           FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_whb, 'Care este regula principală de prioritate în interiorul depozitului?', 'SINGLE_CHOICE', 2)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Utilajul cel mai mare are întotdeauna prioritate',                    FALSE, 1),
      (v_q, 'Pietonii au prioritate absolută în toate zonele de lucru',            TRUE,  2),
      (v_q, 'Prioritatea se stabilește prin contact vizual între operatori',       FALSE, 3),
      (v_q, 'Primul sosit în intersecție are prioritate, indiferent de direcție', FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_whb, 'Cum trebuie să procedeze un operator la intersecțiile din Warehouse B?', 'SINGLE_CHOICE', 3)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Să mențină viteza constantă și să aprindă farurile',                               FALSE, 1),
      (v_q, 'Să oprească complet timp de 5 secunde în fiecare intersecție',                     FALSE, 2),
      (v_q, 'Să reducă viteza, să claxoneze și să aplice regula priorității de dreapta',        TRUE,  3),
      (v_q, 'Să accelereze pentru a elibera intersecția cât mai rapid',                         FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_whb, 'Care este limita de greutate peste care manipularea manuală este strict interzisă individual?', 'SINGLE_CHOICE', 4)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, '10 kg', FALSE, 1),
      (v_q, '15 kg', FALSE, 2),
      (v_q, '20 kg', TRUE,  3),
      (v_q, '30 kg', FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_whb, 'Ce se întâmplă imediat după apăsarea butonului „Am luat la cunoștință"?', 'SINGLE_CHOICE', 5)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Aplicația se închide și se restartează automat',                                    FALSE, 1),
      (v_q, 'Se transmite raportul către HR și se actualizează punctajul XP în leaderboard',    TRUE,  2),
      (v_q, 'Se primește automat permisiunea de a conduce motostivuitorul',                      FALSE, 3),
      (v_q, 'Se deblochează accesul la poarta principală a depozitului',                         FALSE, 4);
  END IF;
  SELECT id INTO v_quiz_whb FROM content_items WHERE title = 'Test de verificare: Siguranța motostivuitorului – WHB';

  -- 7.5 Quiz General: Evacuare, EIP și Deșeuri (pass_threshold=80)
  IF NOT EXISTS (SELECT 1 FROM content_items WHERE title = 'Quiz General: Evacuare, EIP și Deșeuri') THEN
    v_quiz_hse := uuid_generate_v4();
    INSERT INTO content_items
      (id, title, description, content_type, post_type, status, is_mandatory, language,
       category_id, author_id, approved_by, approved_at, xp_reward, xp_bonus_first_attempt)
    VALUES (v_quiz_hse,
      'Quiz General: Evacuare, EIP și Deșeuri',
      'Quiz HSE general pentru toți angajații: procedura de evacuare, utilizarea corectă a EIP și gestionarea deșeurilor periculoase. Prag de trecere: 80%.',
      'QUIZ', 'TRAINING', 'PUBLISHED', TRUE, 'RO',
      v_cat_safety, v_admin, v_admin, NOW(), 50, 15);
    INSERT INTO content_departments (content_id, department_id) VALUES
      (v_quiz_hse, v_dept_prod), (v_quiz_hse, v_dept_log),
      (v_quiz_hse, v_dept_qc),   (v_quiz_hse, v_dept_it), (v_quiz_hse, v_dept_hr)
    ON CONFLICT (content_id, department_id) DO NOTHING;

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Care este prima acțiune pe care trebuie să o facă un angajat la declanșarea alarmei?', 'SINGLE_CHOICE', 1)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Să colecteze toate obiectele personale de valoare',                                        FALSE, 1),
      (v_q, 'Să întrerupă activitatea și să oprească utilajele conform protocolului',                   TRUE,  2),
      (v_q, 'Să sune la recepție pentru a confirma dacă este un exercițiu sau o urgență reală',         FALSE, 3),
      (v_q, 'Să utilizeze cel mai apropiat lift pentru o evacuare rapidă',                              FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Cine are responsabilitatea de a verifica prezența la punctul de adunare?', 'SINGLE_CHOICE', 2)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Managerul general al companiei',                                              FALSE, 1),
      (v_q, 'Administratorul IT prin sistemul de monitorizare video',                     FALSE, 2),
      (v_q, 'Mentorul fiecărei secții, folosind datele din profilul utilizatorului',      TRUE,  3),
      (v_q, 'Echipa de securitate de la poarta principală',                               FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Ce echipament specific este obligatoriu pentru personalul din Warehouse B?', 'SINGLE_CHOICE', 3)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Încălțăminte antistatică și mască de protecție',                  FALSE, 1),
      (v_q, 'Veste reflectorizante și bocanci cu bombeu metalic',              TRUE,  2),
      (v_q, 'Cască audio pentru protecție fonică și ochelari de soare',        FALSE, 3),
      (v_q, 'Mănuși de cauciuc și halat de laborator',                         FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Care este beneficiul finalizării testelor (Quiz) privind utilizarea EIP?', 'SINGLE_CHOICE', 4)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Primirea unei măriri salariale automate',                                            FALSE, 1),
      (v_q, 'Permisiunea de a lucra în regim de telemuncă',                                       FALSE, 2),
      (v_q, 'Deblocarea certificărilor digitale în profil și acumularea de puncte XP',            TRUE,  3),
      (v_q, 'Posibilitatea de a alege designul echipamentului de protecție',                       FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Cum trebuie gestionate deșeurile periculoase (chimicale, uleiuri, electronice)?', 'SINGLE_CHOICE', 5)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'Aruncate în containerele verzi de lângă Linia de Asamblare',                           FALSE, 1),
      (v_q, 'Depozitate în containere etanșe, etichetate, în zone de colectare dedicate',           TRUE,  2),
      (v_q, 'Amestecate cu deșeurile menajere pentru a economisi spațiu',                            FALSE, 3),
      (v_q, 'Depozitate temporar pe palet până la sfârșitul lunii',                                  FALSE, 4);

    INSERT INTO quiz_questions (content_id, question_text, question_type, position)
    VALUES (v_quiz_hse, 'Unde pot fi consultate documentele detaliate despre procesele de eliminare a deșeurilor?', 'SINGLE_CHOICE', 6)
    RETURNING id INTO v_q;
    INSERT INTO quiz_answers (question_id, answer_text, is_correct, position) VALUES
      (v_q, 'În secțiunea de News a aplicației',             FALSE, 1),
      (v_q, 'Pe panoul de afișaj de la intrarea în cantină', FALSE, 2),
      (v_q, 'În secțiunea „Regulations" a aplicației',       TRUE,  3),
      (v_q, 'În manualul tipărit de la recepție',            FALSE, 4);
  END IF;
  SELECT id INTO v_quiz_hse FROM content_items WHERE title = 'Quiz General: Evacuare, EIP și Deșeuri';

  -- ── 8. CERTIFICATIONS ────────────────────────────────────

  INSERT INTO certifications (name, description, content_id, pass_threshold)
  SELECT
    'Certificat Siguranță Producție 2026',
    'Certificat „Safety First" pentru operatorii Liniei de Asamblare 3. Necesită scor 100%.',
    v_quiz_l3, 100
  WHERE NOT EXISTS (
    SELECT 1 FROM certifications WHERE name = 'Certificat Siguranță Producție 2026'
  );

  INSERT INTO certifications (name, description, content_id, pass_threshold)
  SELECT
    'Certificat Standarde Calitate ISO:2026',
    'Certificat de conformitate cu standardele ISO 2026 pentru personalul Stației QC 3.',
    v_quiz_qc3, 80
  WHERE NOT EXISTS (
    SELECT 1 FROM certifications WHERE name = 'Certificat Standarde Calitate ISO:2026'
  );

  INSERT INTO certifications (name, description, content_id, pass_threshold)
  SELECT
    'Certificat Securitate Digitală 2026',
    'Certificat de cunoaștere a politicilor de securitate digitală: VPN, parole și protecție fizică.',
    v_quiz_vpn, 80
  WHERE NOT EXISTS (
    SELECT 1 FROM certifications WHERE name = 'Certificat Securitate Digitală 2026'
  );

  INSERT INTO certifications (name, description, content_id, pass_threshold)
  SELECT
    'Atestat Operare Sigură Motostivuitor 2026',
    'Atestat pentru operatorii din Warehouse B privind utilizarea în siguranță a motostivuitorului.',
    v_quiz_whb, 80
  WHERE NOT EXISTS (
    SELECT 1 FROM certifications WHERE name = 'Atestat Operare Sigură Motostivuitor 2026'
  );

  INSERT INTO certifications (name, description, content_id, pass_threshold)
  SELECT
    'Certificat General HSE 2026',
    'Certificat Health, Safety & Environment pentru cunoașterea procedurilor de evacuare, EIP și managementul deșeurilor.',
    v_quiz_hse, 80
  WHERE NOT EXISTS (
    SELECT 1 FROM certifications WHERE name = 'Certificat General HSE 2026'
  );

  RAISE NOTICE 'Seed 005 completed.';
  RAISE NOTICE '  admin@mail.com  / admin123  (HR_ADMIN, dept=HR)';
  RAISE NOTICE '  mentor@mail.com / mentor123 (MASTER_MENTOR, dept=Producție, section=Linia de Asamblare 3)';
  RAISE NOTICE '  user@mail.com   / user123   (EMPLOYEE, dept=Producție, section=Linia de Asamblare 3)';
  RAISE NOTICE '  user2@mail.com  / user123   (EMPLOYEE, dept=Logistică, section=Warehouse B)';
  RAISE NOTICE '  user3@mail.com  / user123   (EMPLOYEE, dept=Controlul Calității, section=Stația QC 3)';
  RAISE NOTICE '  user4@mail.com  / user123   (EMPLOYEE, dept=IT & Admin, section=Global)';

END $$;

-- ── 9. COMPANY PAGES (upsert — replaces placeholder content) ──
-- About section
INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'about-company', 'about', 'Despre RO-Logistics & Manufacturing Solutions S.A.',
'<h2>RO-Logistics &amp; Manufacturing Solutions S.A.</h2>
<p>Suntem o companie specializată în <strong>producție industrială, asamblare de componente și managementul lanțului de aprovizionare</strong> (logistică și distribuție), cu <strong>165 de angajați activi</strong> pe platformă.</p>
<p><strong>Viziune:</strong> Ne proiectăm viitorul ca o organizație care nu doar stochează date, ci cultivă inteligență colectivă. Prin această aplicație creăm un mediu în care inovația apare natural, deoarece informația corectă ajunge la omul potrivit, în momentul potrivit.</p>',
1, true)
ON CONFLICT (slug) DO UPDATE SET
  title        = EXCLUDED.title,
  body_html    = EXCLUDED.body_html,
  display_order = EXCLUDED.display_order,
  is_published = TRUE,
  updated_at   = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'our-mission', 'about', 'Misiunea Noastră',
'<h2>Misiunea Noastră</h2>
<p>Digital Library nu este doar o arhivă digitală, ci un <strong>ecosistem viu</strong>. Misiunea noastră este să eliminăm barierele ierarhice în calea cunoașterii, transformând experiența fiecărui angajat într-o resursă accesibilă tuturor, reducând astfel timpul de învățare și stresul adaptării.</p>',
2, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'our-values', 'about', 'Valorile Noastre',
'<h2>Valorile Noastre</h2>
<ol>
<li><strong>Transparență Reală:</strong> Credem că posesia informației nu înseamnă putere, ci responsabilitate. Toate procedurile sunt deschise consultării.</li>
<li><strong>Mentoratul ca Stil de Viață:</strong> Încurajăm seniorii să devină creatori de conținut, recunoscând valoarea „know-how-ului" tăcut.</li>
<li><strong>Adaptabilitate (Agilitate):</strong> Procedurile noastre nu sunt fixe și rigide, ci sunt actualizate în timp real de către experții noștri.</li>
</ol>',
3, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'leadership-team', 'about', 'Echipa de Leadership',
'<h2>Echipa de Leadership</h2>
<div class="leader">
  <h3>Dr. Matei Ionescu — Director General (CEO)</h3>
  <blockquote>„Succesul operațional este rezultatul direct al clarității informaționale, motiv pentru care Digital Library va lucra ca instrument de democratizare a know-how-ului."</blockquote>
</div>
<div class="leader">
  <h3>Elena Dumitrescu — Director Resurse Umane (DHR)</h3>
  <blockquote>„Performanța sustenabilă se construiește pe siguranță și claritate. Reducem stresul și eliminăm incertitudinea oferind fiecărui angajat răspunsul potrivit, la momentul potrivit."</blockquote>
</div>
<div class="leader">
  <h3>Firicel Marcel — Director Tehnic (CTO)</h3>
  <blockquote>„Tehnologia de calitate este cea care devine invizibilă pentru utilizator. Simplificăm complexitatea tehnică pentru ca instruirea să fie accesibilă printr-o singură atingere de ecran."</blockquote>
</div>',
4, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'company-history', 'about', 'Istoric și Cultură',
'<h2>Istoricul Companiei</h2>
<ul>
<li><strong>2015</strong> — Am început într-un spațiu de co-working, realizând că echipele pierd 20% din timp căutând informații.</li>
<li><strong>2020</strong> — Pandemia ne-a forțat să ne digitalizăm. Am învățat că distanța fizică nu trebuie să însemne deconectare informațională.</li>
<li><strong>Prezent</strong> — Lansăm acest Hub ca un răspuns direct la fenomenul „Information Overload" și wellbeing-ul angajaților noștri.</li>
</ul>
<h2>Cultura „Learning Friday"</h2>
<p>În fiecare <strong>vineri, după ora 14:00</strong>, nu se organizează ședințe. Este intervalul dedicat exclusiv explorării librăriei, vizionării tutorialelor și cursurilor noi și schimbului de feedback.</p>',
5, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

-- Contact section (real emails)
INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'contact-it', 'contact', 'IT Support',
'<h2>IT Support Desk</h2>
<p><strong>Email:</strong> <a href="mailto:it-support@companie.ro">it-support@companie.ro</a></p>
<p><strong>Canal:</strong> Modul Ticketing din aplicație</p>
<p><strong>SLA urgențe de acces:</strong> &lt; 2 ore</p>
<p><strong>Responsabilități:</strong> Resetare credențiale, erori aplicație, probleme VPN, defecțiuni hardware, acces la conturi și rețea.</p>',
1, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'contact-hr', 'contact', 'Resurse Umane (HR)',
'<h2>Departamentul Resurse Umane</h2>
<p><strong>Email:</strong> <a href="mailto:hr@companie.ro">hr@companie.ro</a></p>
<p><strong>Canal:</strong> Formular Online din aplicație</p>
<p><strong>SLA:</strong> &lt; 24 ore</p>
<p><strong>Responsabilități:</strong> Managementul concediilor, clarificări salariale, adeverințe, probleme de onboarding, politici interne.</p>',
2, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'emergency-contacts', 'contact', 'Urgențe',
'<h2>Contacte de Urgență</h2>
<p><strong>Email urgențe:</strong> <a href="mailto:emergency@companie.ro">emergency@companie.ro</a></p>
<p><strong>Canal:</strong> Butonul „Emergency" din aplicație</p>
<p><strong>Responsabilități:</strong> Incidente critice la locul de muncă, breșe de securitate fizică sau digitală, alerte medicale, întreruperi majore de activitate.</p>
<p><strong>Urgențe naționale:</strong> 112</p>',
3, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();

INSERT INTO company_pages (id, slug, section, title, body_html, display_order, is_published)
VALUES (uuid_generate_v4(), 'faq-general', 'contact', 'Întrebări Frecvente (FAQ)',
'<h2>FAQ - Informații Uzuale</h2>
<p>Oferirea rapidă a informațiilor uzuale fără a deschide un tichet.</p>
<ul>
  <li><strong>Cum resetez parola?</strong> Deschide un tichet la Support IT.</li>
  <li><strong>Cum solicit concediu?</strong> Folosește Formularul Online (Support HR).</li>
  <li><strong>Cum accesez VPN-ul?</strong> Caută "Ghid tehnic" în bara de Search.</li>
  <li><strong>Care este programul HR/ IT?</strong> Verifică SLA-urile de pe pagina de Contact.</li>
  <li><strong>Cum verific zilele de concediu rămase?</strong> Contactează Support HR.</li>
  <li><strong>Ce fac în cazul pierderii laptopului?</strong> Folosește butonul Emergency imediat.</li>
</ul>',
4, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, body_html = EXCLUDED.body_html, is_published = TRUE, updated_at = NOW();