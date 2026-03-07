# 🎓 Classroom Dashboard - Mega Comprehensive Seed Guide

## Overview

This mega seed script populates **ALL 10 TABLES** in your Neon PostgreSQL database with realistic, varied data to showcase all dashboard components effectively.

## 📊 Complete Data Summary

| Table | Records | Description |
|-------|---------|-------------|
| `departments` | 20 | Academic departments (CS to Architecture) |
| `subjects` | 100 | Courses (5 per department) |
| `teachers` | 40 | Faculty members (2 per department) |
| `teacher_subjects` | ~100 | Teaching assignments |
| `user` (students) | 255 | Student accounts |
| `user` (teachers) | 40 | Teacher accounts |
| `user` (admins) | 5 | Admin accounts |
| `account` | 300 | Auth accounts (1 per user) |
| `session` | ~210 | Active user sessions (70%) |
| `verification` | ~90 | Email verification tokens (30%) |
| `classes` | 150 | Class sections across all departments |
| `enrollments` | 2,000+ | Student enrollments over 12 months |

**TOTAL: 3,000+ records across all tables**

## 🎨 Dashboard Data Distribution

### Stats Cards
- **Total Students**: 255
- **Total Classes**: ~90 active
- **Total Teachers**: 40
- **Total Enrollments**: 2,000+

### Department Distribution (Bar Chart/Heatmap)
- All 20 departments represented
- CS, IT, DS, SE have higher enrollment
- Engineering departments moderate
- Humanities varied

### Class Status (Pie Chart)
- **Active**: ~60% (90 classes)
- **Inactive**: ~25% (38 classes)
- **Archived**: ~15% (22 classes)

### Enrollment Trends (12 Months)
Data spread across academic year:
| Month | Enrollment Level |
|-------|-----------------|
| Jul 2025 | Low (summer) |
| Aug 2025 | Medium (fall prep) |
| Sep 2025 | **PEAK** (fall start) |
| Oct 2025 | Medium-High |
| Nov 2025 | Medium |
| Dec 2025 | Low (finals) |
| Jan 2026 | Medium (spring) |
| Feb 2026 | Medium (spring ongoing) |

### Schedule Heatmap
Classes distributed across:
- **Days**: Monday - Friday
- **Time slots**: 09:00, 10:00, 11:00, 13:00, 14:00
- Various combinations for realistic density

## 🚀 How to Run

### Option 1: Neon Console (Recommended)

1. Go to your Neon project at https://console.neon.tech
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Open `seed-mega.sql` in your text editor
5. Copy the **entire** file content (Ctrl+A, Ctrl+C)
6. Paste into Neon SQL Editor (Ctrl+V)
7. Click **Run** or press Ctrl+Enter
8. Wait for completion (~30-60 seconds)
9. Check the results table at bottom

### Option 2: psql Command Line

```bash
# Get your Neon connection string from Neon Console
# Format: postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Run the seed script
psql "your-neon-connection-string" -f seed-mega.sql
```

### Option 3: From Backend (if you have ts-node)

```bash
cd classroom-backend
# Note: This SQL script is standalone, not the TypeScript seed
```

## 📈 Verification Queries

After seeding, verify the data:

```sql
-- 1. Check all table counts
SELECT 'departments' as table_name, COUNT(*) as count FROM departments
UNION ALL SELECT 'subjects', COUNT(*) FROM subjects
UNION ALL SELECT 'teachers', COUNT(*) FROM teachers
UNION ALL SELECT 'classes', COUNT(*) FROM classes
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'students', COUNT(*) FROM "user" WHERE role = 'student'
UNION ALL SELECT 'accounts', COUNT(*) FROM account
UNION ALL SELECT 'sessions', COUNT(*) FROM session;

-- 2. Check class status distribution
SELECT status, COUNT(*) as count 
FROM classes 
GROUP BY status 
ORDER BY count DESC;

-- 3. Check enrollment by month
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as month,
  COUNT(*) as enrollments
FROM enrollments
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

-- 4. Check department enrollment distribution
SELECT 
  d.name as department,
  COUNT(DISTINCT e.student_id) as student_count
FROM departments d
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN classes c ON s.id = c.subject_id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY d.id, d.name
ORDER BY student_count DESC;

-- 5. Check active sessions
SELECT COUNT(*) as active_sessions FROM session WHERE expires_at > NOW();
```

## 🎯 Complete Department List (20)

1. **CS** - Computer Science
2. **IT** - Information Technology
3. **SE** - Software Engineering
4. **DS** - Data Science
5. **MATH** - Mathematics
6. **STAT** - Statistics
7. **PHYS** - Physics
8. **CHEM** - Chemistry
9. **BIO** - Biology
10. **ENG** - English Literature
11. **HIST** - History
12. **ECON** - Economics
13. **PSY** - Psychology
14. **SOC** - Sociology
15. **ME** - Mechanical Engineering
16. **EE** - Electrical Engineering
17. **CE** - Civil Engineering
18. **CHE** - Chemical Engineering
19. **MBA** - Business Administration
20. **ARCH** - Architecture

## 📝 Sample User Accounts

### Admin Accounts (5)
| Email | Name |
|-------|------|
| `admin@university.edu` | Dr. Sarah Mitchell |
| `admin2@university.edu` | Prof. James Chen |
| `admin3@university.edu` | Lisa Thompson |
| `admin4@university.edu` | Dr. Robert Williams |
| `admin5@university.edu` | Maria Garcia |

### Teacher Accounts (sample)
| Email | Name | Department |
|-------|------|------------|
| `m.anderson@university.edu` | Dr. Michael Anderson | CS |
| `e.roberts@university.edu` | Dr. Emily Roberts | CS |
| `d.kim@university.edu` | Prof. David Kim | IT |
| `s.johnson@university.edu` | Dr. Sarah Johnson | IT |

### Student Accounts (sample)
| Email | Name |
|-------|------|
| `student1@student.edu` | Alex Thompson |
| `student2@student.edu` | Jordan Martinez |
| `student3@student.edu` | Taylor Anderson |
| ... | ... |
| `student255@student.edu` | [Auto-generated] |

## 🔧 Troubleshooting

### "Relation already exists" error
The script handles this - it clears data first. Just run again.

### "Foreign key constraint" errors
The script is ordered correctly. If errors persist, check that types (enums) exist.

### "Permission denied" errors
Ensure your Neon user has INSERT/DELETE permissions.

### Low enrollment counts
Run the script again - it uses RANDOM() so numbers vary.

### Sessions not showing
Sessions are auto-generated with 70% probability. Run again if needed.

## 🎨 Expected Dashboard Appearance

After seeding, your dashboard should display:

### 1. Stats Cards
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 255         │ 90          │ 40          │ 2,000+      │
│ Students    │ Classes     │ Teachers    │ Enrollments │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 2. Department Breakdown (Heatmap)
- 20 departments × 8 months = 160 cells
- Color gradient: Red (low) → Green (high)
- Numbers visible in each cell

### 3. Class Status (Donut Chart)
- Three segments with percentages
- Active (60%), Inactive (25%), Archived (15%)

### 4. Top Teachers Table
- Teachers ranked by class count
- Department affiliations shown
- Real names from seed data

### 5. Recent Enrollments Table
- Latest student registrations
- Class names and enrollment dates
- Spread across all departments

## 📊 Database Schema Coverage

✅ **ALL 10 TABLES POPULATED:**

1. ✅ `departments` - 20 academic departments
2. ✅ `subjects` - 100 courses
3. ✅ `teachers` - 40 faculty records
4. ✅ `teacher_subjects` - ~100 assignments
5. ✅ `user` - 300 users (all roles)
6. ✅ `account` - 300 auth accounts
7. ✅ `session` - ~210 active sessions
8. ✅ `verification` - ~90 verification tokens
9. ✅ `classes` - 150 class sections
10. ✅ `enrollments` - 2,000+ enrollments

## 🔐 Auth System Data

The seed includes complete auth data:

- **Accounts**: One per user with OAuth-style tokens
- **Sessions**: 70% of users have active sessions
- **Verification**: 30% have pending email verifications
- **Tokens**: Randomly generated access/refresh tokens

This allows testing of:
- Login/logout functionality
- Session management
- Email verification flows
- Protected routes

## 📧 Support

If you encounter issues:

1. **Check Neon Console logs** for specific errors
2. **Verify connection** to your Neon database
3. **Ensure enums exist** (class_status, role)
4. **Check table order** - script handles dependencies
5. **Run verification queries** to confirm data

---

## 🎯 Quick Stats After Seed

```sql
-- Run this after seeding to see quick stats
SELECT 
  (SELECT COUNT(*) FROM "user" WHERE role = 'student') as students,
  (SELECT COUNT(*) FROM "user" WHERE role = 'teacher') as teachers,
  (SELECT COUNT(*) FROM "user" WHERE role = 'admin') as admins,
  (SELECT COUNT(*) FROM classes WHERE status = 'active') as active_classes,
  (SELECT COUNT(*) FROM enrollments) as total_enrollments,
  (SELECT COUNT(*) FROM session WHERE expires_at > NOW()) as active_sessions;
```

---

**Happy Seeding! 🌱**

Your dashboard will now display rich, realistic data across ALL components!
