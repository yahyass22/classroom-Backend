-- =============================================
-- Dashboard Data Verification Queries
-- Run these in Neon Console to verify data
-- =============================================

-- 1. Check teacher_subjects (should have 48 records)
SELECT COUNT(*) as teacher_subject_count FROM teacher_subjects;

-- 2. Check student distribution across departments (should show all 12)
SELECT 
    d.name as department,
    COUNT(DISTINCT e.student_id) as student_count
FROM departments d
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN classes c ON s.id = c.subject_id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY d.id, d.name
ORDER BY student_count DESC;

-- 3. Check class status distribution (should show all 3 statuses)
SELECT 
    status,
    COUNT(*) as count
FROM classes
GROUP BY status;

-- 4. Check enrollment trends by month (should show 8 months)
SELECT 
    to_char(created_at, 'YYYY-MM') as month,
    COUNT(*) as enrollments
FROM enrollments
GROUP BY month
ORDER BY month;

-- 5. Check classes per department
SELECT 
    d.name as department,
    COUNT(c.id) as class_count
FROM departments d
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN classes c ON s.id = c.subject_id
GROUP BY d.id, d.name
ORDER BY class_count DESC;

-- 6. Check top teachers by class count
SELECT 
    t.first_name || ' ' || t.last_name as teacher_name,
    d.name as department,
    COUNT(c.id) as class_count,
    COUNT(DISTINCT e.student_id) as student_count
FROM teachers t
LEFT JOIN departments d ON t.department_id = d.id
LEFT JOIN user u ON t.email = u.email
LEFT JOIN classes c ON u.id = c.teacher_id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY t.id, d.name
ORDER BY class_count DESC
LIMIT 10;

-- 7. Check schedule data (for heatmap)
SELECT 
    id,
    name,
    schedules
FROM classes
WHERE schedules IS NOT NULL
LIMIT 10;

-- 8. Check user signup trends
SELECT 
    to_char(created_at, 'YYYY-MM') as month,
    role,
    COUNT(*) as count
FROM user
WHERE role IN ('student', 'teacher')
GROUP BY month, role
ORDER BY month;

-- 9. Total counts
SELECT 
    (SELECT COUNT(*) FROM departments) as departments,
    (SELECT COUNT(*) FROM subjects) as subjects,
    (SELECT COUNT(*) FROM teachers) as teachers,
    (SELECT COUNT(*) FROM teacher_subjects) as teacher_subjects,
    (SELECT COUNT(*) FROM classes) as classes,
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM user WHERE role = 'student') as students,
    (SELECT COUNT(*) FROM user WHERE role = 'teacher') as teacher_users;
