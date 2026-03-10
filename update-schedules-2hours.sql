-- ============================================================
-- 🕐 UPDATE ALL CLASS SCHEDULES TO 2-HOUR SESSIONS
-- Realistic Academic Schedule - 2 Hours Per Session
-- ============================================================

-- Update all classes to have realistic 2-hour session schedules
-- Time slots: 08:00-10:00, 10:00-12:00, 13:00-15:00, 15:00-17:00

UPDATE classes SET schedules = CASE 
  -- Monday/Wednesday Morning Slot 1 (08:00-10:00)
  WHEN id % 8 = 0 THEN '[{"day": "Monday", "startTime": "08:00", "endTime": "10:00"}, {"day": "Wednesday", "startTime": "08:00", "endTime": "10:00"}]'::JSONB
  
  -- Monday/Wednesday Morning Slot 2 (10:00-12:00)
  WHEN id % 8 = 1 THEN '[{"day": "Monday", "startTime": "10:00", "endTime": "12:00"}, {"day": "Wednesday", "startTime": "10:00", "endTime": "12:00"}]'::JSONB
  
  -- Monday/Wednesday Afternoon Slot 1 (13:00-15:00)
  WHEN id % 8 = 2 THEN '[{"day": "Monday", "startTime": "13:00", "endTime": "15:00"}, {"day": "Wednesday", "startTime": "13:00", "endTime": "15:00"}]'::JSONB
  
  -- Monday/Wednesday Afternoon Slot 2 (15:00-17:00)
  WHEN id % 8 = 3 THEN '[{"day": "Monday", "startTime": "15:00", "endTime": "17:00"}, {"day": "Wednesday", "startTime": "15:00", "endTime": "17:00"}]'::JSONB
  
  -- Tuesday/Thursday Morning Slot 1 (08:00-10:00)
  WHEN id % 8 = 4 THEN '[{"day": "Tuesday", "startTime": "08:00", "endTime": "10:00"}, {"day": "Thursday", "startTime": "08:00", "endTime": "10:00"}]'::JSONB
  
  -- Tuesday/Thursday Morning Slot 2 (10:00-12:00)
  WHEN id % 8 = 5 THEN '[{"day": "Tuesday", "startTime": "10:00", "endTime": "12:00"}, {"day": "Thursday", "startTime": "10:00", "endTime": "12:00"}]'::JSONB
  
  -- Tuesday/Thursday Afternoon Slot 1 (13:00-15:00)
  WHEN id % 8 = 6 THEN '[{"day": "Tuesday", "startTime": "13:00", "endTime": "15:00"}, {"day": "Thursday", "startTime": "13:00", "endTime": "15:00"}]'::JSONB
  
  -- Tuesday/Thursday Afternoon Slot 2 (15:00-17:00)
  WHEN id % 8 = 7 THEN '[{"day": "Tuesday", "startTime": "15:00", "endTime": "17:00"}, {"day": "Thursday", "startTime": "15:00", "endTime": "17:00"}]'::JSONB
  
  -- Friday Special Sessions (4-hour lab sessions for practical courses)
  ELSE '[{"day": "Friday", "startTime": "09:00", "endTime": "11:00"}]'::JSONB
END;

-- Verify the update
SELECT 
  c.id,
  c.name,
  s.name as subject_name,
  c.schedules,
  CASE 
    WHEN c.schedules::text LIKE '%08:00%' AND c.schedules::text LIKE '%10:00%' THEN '08:00-10:00 (2hrs)'
    WHEN c.schedules::text LIKE '%10:00%' AND c.schedules::text LIKE '%12:00%' THEN '10:00-12:00 (2hrs)'
    WHEN c.schedules::text LIKE '%13:00%' AND c.schedules::text LIKE '%15:00%' THEN '13:00-15:00 (2hrs)'
    WHEN c.schedules::text LIKE '%15:00%' AND c.schedules::text LIKE '%17:00%' THEN '15:00-17:00 (2hrs)'
    WHEN c.schedules::text LIKE '%09:00%' AND c.schedules::text LIKE '%11:00%' THEN '09:00-11:00 (2hrs)'
    ELSE 'Other'
  END as time_slot
FROM classes c
JOIN subjects s ON c.subject_id = s.id
ORDER BY c.id
LIMIT 20;

-- Summary of schedule distribution
SELECT 
  CASE 
    WHEN schedules::text LIKE '%Monday%' AND schedules::text LIKE '%Wednesday%' AND schedules::text LIKE '%08:00%' THEN 'Mon/Wed 08:00-10:00'
    WHEN schedules::text LIKE '%Monday%' AND schedules::text LIKE '%Wednesday%' AND schedules::text LIKE '%10:00%' THEN 'Mon/Wed 10:00-12:00'
    WHEN schedules::text LIKE '%Monday%' AND schedules::text LIKE '%Wednesday%' AND schedules::text LIKE '%13:00%' THEN 'Mon/Wed 13:00-15:00'
    WHEN schedules::text LIKE '%Monday%' AND schedules::text LIKE '%Wednesday%' AND schedules::text LIKE '%15:00%' THEN 'Mon/Wed 15:00-17:00'
    WHEN schedules::text LIKE '%Tuesday%' AND schedules::text LIKE '%Thursday%' AND schedules::text LIKE '%08:00%' THEN 'Tue/Thu 08:00-10:00'
    WHEN schedules::text LIKE '%Tuesday%' AND schedules::text LIKE '%Thursday%' AND schedules::text LIKE '%10:00%' THEN 'Tue/Thu 10:00-12:00'
    WHEN schedules::text LIKE '%Tuesday%' AND schedules::text LIKE '%Thursday%' AND schedules::text LIKE '%13:00%' THEN 'Tue/Thu 13:00-15:00'
    WHEN schedules::text LIKE '%Tuesday%' AND schedules::text LIKE '%Thursday%' AND schedules::text LIKE '%15:00%' THEN 'Tue/Thu 15:00-17:00'
    WHEN schedules::text LIKE '%Friday%' THEN 'Friday 09:00-11:00'
    ELSE 'Other'
  END as schedule_pattern,
  COUNT(*) as class_count
FROM classes
GROUP BY schedule_pattern
ORDER BY class_count DESC;
