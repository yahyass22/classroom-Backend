# 🌱 Database Seeding Guide

## Overview

This guide explains how to populate your database with sample data for testing the dashboard analytics.

## Seed Scripts

### 1. Full Seed (Recommended for Dashboard Testing)

Creates comprehensive data across all departments:
- **12 departments** (CS, IT, Math, Statistics, Physics, Chemistry, Biology, English, History, Economics, Psychology, Mechanical Engineering)
- **36 subjects** (3 per department)
- **24 teachers** (2 per department)
- **48 classes** (4 per department with varied statuses)
- **200 students**
- **600+ enrollments** (spread across 8 months)
- **3 admins**

**Run:**
```bash
cd classroom-backend
npm run db:seed:full
```

⚠️ **Warning:** This script clears all existing data before seeding!

---

### 2. Basic Seed

Creates minimal data for basic functionality testing:
- 5 departments
- 9 subjects
- 3 teachers
- 9 classes
- ~100 enrollments

**Run:**
```bash
cd classroom-backend
npm run db:seed
```

---

## Dashboard Chart Data Requirements

After running `npm run db:seed:full`, your dashboard charts will display:

| Chart | Data Source | What You'll See |
|-------|-------------|-----------------|
| **Class Status Pie Chart** | Classes with active/inactive/archived status | 3 segments showing distribution |
| **Student Donut Chart** | Enrollments across 12 departments | 12 segments (all departments represented) |
| **Department Distribution Bar Chart** | Classes/subjects/teachers per dept | Grouped bars for each department |
| **Enrollment Stacked Bar Chart** | Monthly enrollments by department | Stacked bars showing trends over 8 months |
| **Schedule Heatmap** | Class schedules (day/time) | Heatmap showing busiest class times |
| **User Signup Trend Line Chart** | User creation dates | Lines for students/teachers over time |
| **Top Teachers Table** | Teachers with most classes | Ranked list of top 10 teachers |

---

## Verifying Data

After seeding, run these SQL queries in **Neon Console** to verify:

```sql
-- Check department distribution
SELECT d.name, COUNT(DISTINCT e.student_id) as students
FROM departments d
LEFT JOIN subjects s ON d.id = s.department_id
LEFT JOIN classes c ON s.id = c.subject_id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY d.id, d.name
ORDER BY students DESC;

-- Check class status distribution
SELECT status, COUNT(*) as count
FROM classes
GROUP BY status;

-- Check enrollment trends by month
SELECT 
    to_char(created_at, 'YYYY-MM') as month,
    COUNT(*) as enrollments
FROM enrollments
GROUP BY month
ORDER BY month;
```

---

## Troubleshooting

### Charts showing empty/black circles

**Problem:** Not enough data variety

**Solution:** Run the full seed script:
```bash
npm run db:seed:full
```

### Heatmap not showing

**Problem:** Classes don't have schedules

**Solution:** The full seed script adds schedules automatically. Verify with:
```sql
SELECT id, name, schedules FROM classes 
WHERE schedules IS NOT NULL 
LIMIT 5;
```

### No enrollment trends

**Problem:** All enrollments have same date

**Solution:** Full seed spreads enrollments across 8 months automatically.

---

## Custom Data Generation

To customize the seed data, edit `src/seed-full.ts`:

1. **More students:** Increase the loop count in student creation
2. **More enrollments:** Increase `numStudents` per class
3. **Different date range:** Modify the `months` array
4. **More classes per department:** Adjust the class creation loop

---

## Reset Database

To completely reset and reseed:

```bash
# 1. Run full seed (clears data automatically)
npm run db:seed:full

# 2. Or manually drop and recreate tables in Neon Console
# Then run seed script
```

---

## Expected Results

After running `npm run db:seed:full`:

```
📊 Summary:
   - 12 departments
   - 36 subjects
   - 24 teachers
   - 48 classes
   - 600+ enrollments
   - 200 students
   - 3 admins

🎨 Dashboard charts should now display properly!
```

All charts will show varied, realistic data suitable for dashboard demonstration and testing.
