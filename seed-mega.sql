-- ============================================================
-- 🎓 ULTIMATE MEGA SEED SCRIPT FOR CLASSROOM DASHBOARD
-- Comprehensive Big Data for All Dashboard Visualizations
-- Academic Year: September 2024 - August 2025
-- ============================================================

-- ============================================================
-- STEP 1: CLEAR EXISTING DATA
-- ============================================================
DELETE FROM session;
DELETE FROM account;
DELETE FROM verification;
DELETE FROM enrollments;
DELETE FROM teacher_subjects;
DELETE FROM classes;
DELETE FROM teachers;
DELETE FROM subjects;
DELETE FROM departments;
DELETE FROM "user" WHERE role IN ('student', 'teacher', 'admin');

ALTER TABLE departments ALTER COLUMN id RESTART WITH 1;
ALTER TABLE subjects ALTER COLUMN id RESTART WITH 1;
ALTER TABLE teachers ALTER COLUMN id RESTART WITH 1;
ALTER TABLE classes ALTER COLUMN id RESTART WITH 1;

-- ============================================================
-- STEP 2: DEPARTMENTS (15 units)
-- ============================================================
INSERT INTO departments (code, name, description) VALUES
  ('CS', 'Computer Science', 'Computing and software engineering'),
  ('MATH', 'Mathematics', 'Pure and applied mathematical sciences'),
  ('PHYS', 'Physics', 'Classical and quantum physical sciences'),
  ('BIO', 'Biology', 'Life sciences and biotechnology'),
  ('CHEM', 'Chemistry', 'Chemical sciences and materials'),
  ('ENG', 'English', 'Literature and composition'),
  ('HIST', 'History', 'World history and archaeology'),
  ('ECON', 'Economics', 'Economic theory and financial studies'),
  ('PSY', 'Psychology', 'Behavioral and mental sciences'),
  ('ART', 'Fine Arts', 'Visual arts and design'),
  ('ME', 'Mechanical Engineering', 'Mechanical systems and robotics'),
  ('EE', 'Electrical Engineering', 'Electronics and power systems'),
  ('BUS', 'Business', 'Management and leadership'),
  ('CE', 'Civil Engineering', 'Infrastructure and structural design'),
  ('SE', 'Software Engineering', 'Applied software development');

-- ============================================================
-- STEP 3: SUBJECTS (75 total)
-- ============================================================
INSERT INTO subjects (department_id, code, name, description) VALUES
  (1, 'CS101', 'Intro to Programming', 'Python basics'),
  (1, 'CS201', 'Data Structures', 'Algorithms'),
  (1, 'CS301', 'Database Systems', 'SQL design'),
  (1, 'CS401', 'Artificial Intelligence', 'ML Networks'),
  (1, 'CS402', 'Web Development', 'Full-stack apps'),
  (2, 'MATH101', 'Calculus I', 'Differentiation'),
  (2, 'MATH201', 'Linear Algebra', 'Vectors matrices'),
  (2, 'MATH301', 'Probability', 'Statistics'),
  (2, 'MATH401', 'Discrete Math', 'Logic sets'),
  (2, 'MATH402', 'Numerical Analysis', 'Computational math'),
  (3, 'PHYS101', 'Classical Mechanics', 'Newtonian physics'),
  (3, 'PHYS201', 'Electromagnetism', 'Fields circuits'),
  (3, 'PHYS301', 'Quantum Physics', 'Subatomic particles'),
  (3, 'PHYS401', 'Astrophysics', 'Stars galaxies'),
  (3, 'PHYS402', 'Thermodynamics', 'Heat energy'),
  (4, 'BIO101', 'General Biology', 'Cells genetics'),
  (4, 'BIO201', 'Microbiology', 'Bacteria viruses'),
  (4, 'BIO301', 'Ecology', 'Ecosystems'),
  (4, 'BIO401', 'Human Anatomy', 'Body systems'),
  (4, 'BIO402', 'Molecular Biology', 'DNA proteins'),
  (5, 'CHEM101', 'General Chemistry', 'Atomic structure'),
  (5, 'CHEM201', 'Organic Chemistry', 'Carbon compounds'),
  (5, 'CHEM301', 'Physical Chemistry', 'Chemical kinetics'),
  (5, 'CHEM401', 'Biochemistry', 'Chemistry of life'),
  (5, 'CHEM402', 'Analytical Chemistry', 'Spectroscopy'),
  (6, 'ENG101', 'Composition I', 'Writing fundamentals'),
  (6, 'ENG201', 'British Literature', 'Shakespeare'),
  (6, 'ENG301', 'American Literature', 'Colonial era'),
  (6, 'ENG401', 'Creative Writing', 'Fiction poetry'),
  (6, 'ENG402', 'Linguistics', 'Language structure'),
  (7, 'HIST101', 'World History', 'Ancient civilizations'),
  (7, 'HIST201', 'European History', 'Medieval modern'),
  (7, 'HIST301', 'American History', 'Revolution present'),
  (7, 'HIST401', 'Asian History', 'Eastern civilizations'),
  (7, 'HIST402', 'Archaeology', 'Excavation methods'),
  (8, 'ECON101', 'Microeconomics', 'Supply demand'),
  (8, 'ECON201', 'Macroeconomics', 'National economies'),
  (8, 'ECON301', 'International Trade', 'Global markets'),
  (8, 'ECON401', 'Econometrics', 'Statistical economics'),
  (8, 'ECON402', 'Development Economics', 'Emerging markets'),
  (9, 'PSY101', 'Intro to Psychology', 'Mind behavior'),
  (9, 'PSY201', 'Developmental Psychology', 'Life span'),
  (9, 'PSY301', 'Cognitive Psychology', 'Memory perception'),
  (9, 'PSY401', 'Clinical Psychology', 'Mental health'),
  (9, 'PSY402', 'Social Psychology', 'Group behavior'),
  (10, 'ART101', 'Art History', 'Renaissance modern'),
  (10, 'ART201', 'Drawing Fundamentals', 'Perspective form'),
  (10, 'ART301', 'Digital Design', 'Graphic software'),
  (10, 'ART401', 'Photography', 'Digital film'),
  (10, 'ART402', 'Sculpture', '3D art forms'),
  (11, 'ME101', 'Statics', 'Forces equilibrium'),
  (11, 'ME201', 'Thermodynamics', 'Heat energy'),
  (11, 'ME301', 'Fluid Mechanics', 'Flow pressure'),
  (11, 'ME401', 'Robotics', 'Kinematics control'),
  (11, 'ME402', 'CAD Design', 'Computer-aided design'),
  (12, 'EE101', 'Circuit Analysis', 'DC AC circuits'),
  (12, 'EE201', 'Digital Logic', 'Boolean algebra'),
  (12, 'EE301', 'Signals and Systems', 'Fourier analysis'),
  (12, 'EE401', 'Control Systems', 'Feedback stability'),
  (12, 'EE402', 'Power Systems', 'Electric grids'),
  (13, 'BUS101', 'Management', 'Leadership culture'),
  (13, 'BUS201', 'Marketing', 'Consumer behavior'),
  (13, 'BUS301', 'Finance', 'Capital risk'),
  (13, 'BUS401', 'Strategy', 'Competitive analysis'),
  (13, 'BUS402', 'Entrepreneurship', 'Startup fundamentals'),
  (14, 'CE101', 'Engineering Mechanics', 'Statics dynamics'),
  (14, 'CE201', 'Structural Analysis', 'Beam frame design'),
  (14, 'CE301', 'Geotechnical Engineering', 'Soil mechanics'),
  (14, 'CE401', 'Transportation Engineering', 'Highway design'),
  (14, 'CE402', 'Environmental Engineering', 'Water treatment'),
  (15, 'SE101', 'Programming Fundamentals', 'Java OOP'),
  (15, 'SE201', 'Software Design Patterns', 'Architecture'),
  (15, 'SE301', 'Agile Development', 'Scrum Kanban'),
  (15, 'SE401', 'DevOps', 'CI/CD pipelines'),
  (15, 'SE402', 'Cloud Computing', 'AWS Azure');

-- ============================================================
-- STEP 4: ADMINS (3)
-- ============================================================
INSERT INTO "user" (id, name, email, email_verified, role, created_at) VALUES
  ('admin-001', 'Dr. Richard Sterling', 'r.sterling@university.edu', true, 'admin', NOW() - INTERVAL '2 years'),
  ('admin-002', 'Prof. Margaret Chen', 'm.chen@university.edu', true, 'admin', NOW() - INTERVAL '18 months'),
  ('admin-003', 'James Morrison', 'j.morrison@university.edu', true, 'admin', NOW() - INTERVAL '1 year');

-- ============================================================
-- STEP 5: TEACHERS (60 users)
-- ============================================================
INSERT INTO "user" (id, name, email, email_verified, role, created_at) VALUES
  ('teacher-001', 'Dr. Sarah Mitchell', 's.mitchell@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-002', 'Prof. James Chen', 'j.chen@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-003', 'Dr. Emily Rodriguez', 'e.rodriguez@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-004', 'Prof. Michael O''Brien', 'm.obrien@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-005', 'Dr. Aisha Patel', 'a.patel@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-006', 'Prof. David Kim', 'd.kim@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-007', 'Dr. Lisa Thompson', 'l.thompson@university.edu', true, 'teacher', NOW() - INTERVAL '8 years'),
  ('teacher-008', 'Prof. Robert Garcia', 'r.garcia@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-009', 'Dr. Jennifer Wu', 'j.wu@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-010', 'Prof. William Brown', 'w.brown@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-011', 'Dr. Maria Santos', 'm.santos@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-012', 'Prof. Thomas Anderson', 't.anderson@university.edu', true, 'teacher', NOW() - INTERVAL '9 years'),
  ('teacher-013', 'Dr. Rachel Green', 'r.green@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-014', 'Prof. Daniel Lee', 'd.lee@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-015', 'Dr. Amanda White', 'a.white@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-016', 'Prof. Christopher Martin', 'c.martin@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-017', 'Dr. Jessica Taylor', 'j.taylor@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-018', 'Prof. Matthew Harris', 'm.harris@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-019', 'Dr. Nicole Clark', 'n.clark@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-020', 'Prof. Andrew Lewis', 'a.lewis@university.edu', true, 'teacher', NOW() - INTERVAL '8 years'),
  ('teacher-021', 'Dr. Stephanie Walker', 's.walker@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-022', 'Prof. Kevin Hall', 'k.hall@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-023', 'Dr. Laura Allen', 'l.allen@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-024', 'Prof. Brian Young', 'b.young@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-025', 'Dr. Michelle King', 'm.king@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-026', 'Prof. Jason Wright', 'j.wright@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-027', 'Dr. Elizabeth Scott', 'e.scott@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-028', 'Prof. Ryan Adams', 'r.adams@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-029', 'Dr. Kimberly Baker', 'k.baker@university.edu', true, 'teacher', NOW() - INTERVAL '8 years'),
  ('teacher-030', 'Prof. Jonathan Nelson', 'j.nelson@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-031', 'Dr. Rebecca Hill', 'r.hill@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-032', 'Prof. Nicholas Moore', 'n.moore@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-033', 'Dr. Patricia Jackson', 'p.jackson@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-034', 'Prof. Eric Thomas', 'e.thomas@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-035', 'Dr. Sandra Phillips', 's.phillips@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-036', 'Prof. Steven Campbell', 's.campbell@university.edu', true, 'teacher', NOW() - INTERVAL '1 year'),
  ('teacher-037', 'Dr. Karen Parker', 'k.parker@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-038', 'Prof. George Evans', 'g.evans@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-039', 'Dr. Helen Edwards', 'h.edwards@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-040', 'Prof. Kenneth Collins', 'k.collins@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-041', 'Dr. Dorothy Stewart', 'd.stewart@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-042', 'Prof. Ronald Sanchez', 'r.sanchez@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-043', 'Dr. Carol Morris', 'c.morris@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-044', 'Prof. Paul Rogers', 'p.rogers@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-045', 'Dr. Ruth Reed', 'r.reed@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-046', 'Prof. Frank Cook', 'f.cook@university.edu', true, 'teacher', NOW() - INTERVAL '1 year'),
  ('teacher-047', 'Dr. Sharon Morgan', 's.morgan@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-048', 'Prof. Raymond Bell', 'r.bell@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-049', 'Dr. Deborah Murphy', 'd.murphy@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-050', 'Prof. Jerry Bailey', 'j.bailey@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-051', 'Dr. Cynthia Rivera', 'c.rivera@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-052', 'Prof. Dennis Cooper', 'd.cooper@university.edu', true, 'teacher', NOW() - INTERVAL '5 years'),
  ('teacher-053', 'Dr. Amy Richardson', 'a.richardson@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-054', 'Prof. Walter Cox', 'w.cox@university.edu', true, 'teacher', NOW() - INTERVAL '7 years'),
  ('teacher-055', 'Dr. Angela Howard', 'a.howard@university.edu', true, 'teacher', NOW() - INTERVAL '2 years'),
  ('teacher-056', 'Prof. Henry Ward', 'h.ward@university.edu', true, 'teacher', NOW() - INTERVAL '6 years'),
  ('teacher-057', 'Dr. Brenda Torres', 'b.torres@university.edu', true, 'teacher', NOW() - INTERVAL '3 years'),
  ('teacher-058', 'Prof. Peter Peterson', 'p.peterson@university.edu', true, 'teacher', NOW() - INTERVAL '4 years'),
  ('teacher-059', 'Dr. Emma Gray', 'e.gray@university.edu', true, 'teacher', NOW() - INTERVAL '1 year'),
  ('teacher-060', 'Prof. Douglas Ramirez', 'd.ramirez@university.edu', true, 'teacher', NOW() - INTERVAL '5 years');

-- ============================================================
-- STEP 6: STUDENTS (500 with varied enrollment dates)
-- ============================================================
INSERT INTO "user" (id, name, email, email_verified, role, created_at)
SELECT
  'student-' || LPAD(i::TEXT, 3, '0'),
  (ARRAY['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Oliver', 'Isabella', 'Elijah', 'Sophia', 'James',
         'Mia', 'William', 'Charlotte', 'Benjamin', 'Amelia', 'Lucas', 'Harper', 'Henry', 'Evelyn', 'Alexander',
         'Abigail', 'Mason', 'Emily', 'Michael', 'Elizabeth', 'Ethan', 'Sofia', 'Daniel', 'Avery', 'Jackson',
         'Ella', 'Sebastian', 'Scarlett', 'Aiden', 'Grace', 'Matthew', 'Chloe', 'Samuel', 'Victoria', 'David',
         'Riley', 'Joseph', 'Lily', 'Carter', 'Aurora', 'Owen', 'Zoey', 'Wyatt', 'Penelope', 'John'])[1 + ((i - 1) % 50)] || ' ' ||
  (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
         'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
         'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
         'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'])[1 + ((i * 7) % 40)],
  'student-' || LPAD(i::TEXT, 3, '0') || '@student.edu',
  true,
  'student',
  DATE '2024-09-01' + ((i % 12) || ' months')::INTERVAL + ((1 + (i % 28)) || ' days')::INTERVAL
FROM generate_series(1, 500) AS i;

-- ============================================================
-- STEP 7: TEACHER RECORDS (60)
-- ============================================================
INSERT INTO teachers (department_id, employee_id, first_name, last_name, email, specialization)
SELECT
  (1 + ((id_num - 1) % 15)),
  'EMP-' || LPAD(id_num::TEXT, 4, '0'),
  SPLIT_PART((SELECT name FROM "user" WHERE id = 'teacher-' || LPAD(id_num::TEXT, 3, '0')), ' ', 2),
  SPLIT_PART((SELECT name FROM "user" WHERE id = 'teacher-' || LPAD(id_num::TEXT, 3, '0')), ' ', 3),
  (SELECT email FROM "user" WHERE id = 'teacher-' || LPAD(id_num::TEXT, 3, '0')),
  (SELECT name FROM departments WHERE id = (1 + ((id_num - 1) % 15))) || ' - Advanced Studies'
FROM generate_series(1, 60) AS id_num;

-- ============================================================
-- STEP 8: TEACHER_SUBJECTS (Link teachers to subjects)
-- ============================================================
INSERT INTO teacher_subjects (teacher_id, subject_id)
SELECT
  t.id,
  s.id
FROM teachers t
JOIN subjects s ON s.department_id = t.department_id
WHERE t.id <= 55
AND (
  (s.id % 3 = t.id % 3) OR 
  (s.id % 5 = t.id % 5) OR
  (s.id % 7 = t.id % 7)
);

-- ============================================================
-- STEP 9: CLASSES (150+ with varied schedules)
-- ============================================================
INSERT INTO classes (subject_id, teacher_id, invite_code, name, capacity, status, schedules, created_at)
SELECT
  s.id,
  'teacher-' || LPAD((1 + (s.id % 60))::TEXT, 3, '0'),
  UPPER(s.code) || '-' || FLOOR(RANDOM() * 9000 + 1000)::TEXT,
  s.name || ' - Section ' || ((gs % 3) + 1),
  CASE
    WHEN s.id % 4 = 0 THEN 25
    WHEN s.id % 4 = 1 THEN 45
    WHEN s.id % 4 = 2 THEN 75
    ELSE 150
  END,
  CASE
    WHEN s.id % 12 = 0 THEN 'archived'
    WHEN s.id % 12 = 1 THEN 'inactive'
    ELSE 'active'
  END::class_status,
  CASE (s.id + gs) % 10
    WHEN 0 THEN '[{"day": "Monday", "startTime": "08:00", "endTime": "09:30"}, {"day": "Wednesday", "startTime": "08:00", "endTime": "09:30"}]'::JSONB
    WHEN 1 THEN '[{"day": "Monday", "startTime": "09:30", "endTime": "11:00"}, {"day": "Wednesday", "startTime": "09:30", "endTime": "11:00"}]'::JSONB
    WHEN 2 THEN '[{"day": "Monday", "startTime": "11:00", "endTime": "12:30"}, {"day": "Wednesday", "startTime": "11:00", "endTime": "12:30"}]'::JSONB
    WHEN 3 THEN '[{"day": "Monday", "startTime": "14:00", "endTime": "15:30"}, {"day": "Wednesday", "startTime": "14:00", "endTime": "15:30"}]'::JSONB
    WHEN 4 THEN '[{"day": "Tuesday", "startTime": "08:00", "endTime": "09:30"}, {"day": "Thursday", "startTime": "08:00", "endTime": "09:30"}]'::JSONB
    WHEN 5 THEN '[{"day": "Tuesday", "startTime": "09:30", "endTime": "11:00"}, {"day": "Thursday", "startTime": "09:30", "endTime": "11:00"}]'::JSONB
    WHEN 6 THEN '[{"day": "Tuesday", "startTime": "11:00", "endTime": "12:30"}, {"day": "Thursday", "startTime": "11:00", "endTime": "12:30"}]'::JSONB
    WHEN 7 THEN '[{"day": "Tuesday", "startTime": "14:00", "endTime": "15:30"}, {"day": "Thursday", "startTime": "14:00", "endTime": "15:30"}]'::JSONB
    WHEN 8 THEN '[{"day": "Friday", "startTime": "09:00", "endTime": "12:00"}]'::JSONB
    ELSE '[{"day": "Friday", "startTime": "13:00", "endTime": "16:00"}]'::JSONB
  END,
  NOW() - INTERVAL '8 months' + (s.id || ' days')::INTERVAL
FROM subjects s
CROSS JOIN generate_series(0, 1) AS gs;

-- ============================================================
-- STEP 9B: ADDITIONAL CLASSES (Popular subjects)
-- ============================================================
INSERT INTO classes (subject_id, teacher_id, invite_code, name, capacity, status, schedules, created_at)
SELECT
  s.id,
  'teacher-' || LPAD((1 + (s.id % 60))::TEXT, 3, '0'),
  UPPER(s.code) || '-' || FLOOR(RANDOM() * 9000 + 1000)::TEXT,
  s.name || ' - Section ' || (gs + 3),
  50,
  'active',
  '[{"day": "Monday", "startTime": "10:00", "endTime": "11:30"}, {"day": "Wednesday", "startTime": "10:00", "endTime": "11:30"}]'::JSONB,
  NOW() - INTERVAL '6 months'
FROM subjects s
CROSS JOIN generate_series(1, 2) AS gs
WHERE s.id IN (1, 2, 6, 7, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71);

-- ============================================================
-- STEP 10: ENROLLMENTS - Critical Saturation (95-100%)
-- ============================================================
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + ((gs + c.id * 7) % 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-09-01' + ((c.id + gs) % 30 || ' days')::INTERVAL
FROM classes c
CROSS JOIN generate_series(1, 1) gs
WHERE c.id BETWEEN 1 AND 20
AND gs <= c.capacity * 0.98;

-- ============================================================
-- STEP 11: ENROLLMENTS - Warning Saturation (75-85%)
-- ============================================================
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + ((gs + c.id * 11) % 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-10-01' + ((c.id + gs) % 30 || ' days')::INTERVAL
FROM classes c
CROSS JOIN generate_series(1, 1) gs
WHERE c.id BETWEEN 21 AND 40
AND gs <= c.capacity * 0.80;

-- ============================================================
-- STEP 12: ENROLLMENTS - Healthy Enrollment (50-70%)
-- ============================================================
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + ((gs + c.id * 13) % 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-11-01' + ((c.id + gs) % 30 || ' days')::INTERVAL
FROM classes c
CROSS JOIN generate_series(1, 1) gs
WHERE c.id BETWEEN 41 AND 70
AND gs <= c.capacity * 0.60;

-- ============================================================
-- STEP 13: ENROLLMENTS - Low Enrollment (25-45%)
-- ============================================================
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + ((gs + c.id * 17) % 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-12-01' + ((c.id + gs) % 30 || ' days')::INTERVAL
FROM classes c
CROSS JOIN generate_series(1, 1) gs
WHERE c.id BETWEEN 71 AND 90
AND gs <= c.capacity * 0.35;

-- ============================================================
-- STEP 14: ENROLLMENTS - Academic Year Trends (5000+)
-- ============================================================
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + FLOOR(RANDOM() * 500))::TEXT, 3, '0'),
  (1 + FLOOR(RANDOM() * 100))::INTEGER,
  CASE 
    WHEN gs <= 800 THEN DATE '2024-09-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 1400 THEN DATE '2024-10-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 1900 THEN DATE '2024-11-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 2200 THEN DATE '2024-12-01' + (FLOOR(RANDOM() * 20) || ' days')::INTERVAL
    WHEN gs <= 2800 THEN DATE '2025-01-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 3300 THEN DATE '2025-02-01' + (FLOOR(RANDOM() * 28) || ' days')::INTERVAL
    WHEN gs <= 3800 THEN DATE '2025-03-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 4200 THEN DATE '2025-04-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 4500 THEN DATE '2025-05-01' + (FLOOR(RANDOM() * 25) || ' days')::INTERVAL
    WHEN gs <= 4700 THEN DATE '2025-06-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    WHEN gs <= 4850 THEN DATE '2025-07-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
    ELSE DATE '2025-08-01' + (FLOOR(RANDOM() * 30) || ' days')::INTERVAL
  END
FROM generate_series(1, 5000) AS gs
ON CONFLICT (student_id, class_id) DO NOTHING;

-- Department-specific enrollment patterns
INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + FLOOR(RANDOM() * 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-09-01' + (FLOOR(RANDOM() * 335) || ' days')::INTERVAL
FROM classes c
WHERE c.subject_id IN (1, 2, 3, 4, 5)
AND FLOOR(RANDOM() * 100) < 85
ON CONFLICT (student_id, class_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + FLOOR(RANDOM() * 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-09-01' + (FLOOR(RANDOM() * 335) || ' days')::INTERVAL
FROM classes c
WHERE c.subject_id IN (61, 62, 63, 64, 65)
AND FLOOR(RANDOM() * 100) < 80
ON CONFLICT (student_id, class_id) DO NOTHING;

INSERT INTO enrollments (student_id, class_id, created_at)
SELECT
  'student-' || LPAD((1 + FLOOR(RANDOM() * 500))::TEXT, 3, '0'),
  c.id,
  DATE '2024-09-01' + (FLOOR(RANDOM() * 335) || ' days')::INTERVAL
FROM classes c
WHERE c.subject_id IN (46, 47, 48, 49, 50)
AND FLOOR(RANDOM() * 100) < 45
ON CONFLICT (student_id, class_id) DO NOTHING;

-- ============================================================
-- STEP 15: AUTH ACCOUNTS
-- ============================================================
INSERT INTO account (id, account_id, provider_id, user_id, access_token, scope, created_at)
SELECT
  'acc-' || id,
  'account-' || id,
  'credentials',
  id,
  'token-' || MD5(RANDOM()::TEXT),
  'all',
  created_at
FROM "user";

-- ============================================================
-- STEP 16: SESSIONS (70% of users)
-- ============================================================
INSERT INTO session (id, user_id, token, expires_at, ip_address, user_agent, created_at)
SELECT
  'sess-' || MD5(RANDOM()::TEXT),
  id,
  'session-' || MD5(RANDOM()::TEXT),
  NOW() + INTERVAL '30 days',
  '192.168.1.' || (RANDOM() * 255)::INTEGER,
  'Mozilla/5.0 AppleWebKit/537.36',
  NOW() - INTERVAL '1 day'
FROM "user"
WHERE RANDOM() < 0.7;

-- ============================================================
-- STEP 17: VERIFICATION TOKENS (10% of users)
-- ============================================================
INSERT INTO verification (id, identifier, value, expires_at, created_at)
SELECT
  'verif-' || MD5(RANDOM()::TEXT),
  email,
  MD5(RANDOM()::TEXT),
  NOW() + INTERVAL '1 hour',
  NOW()
FROM "user"
WHERE RANDOM() < 0.1;





