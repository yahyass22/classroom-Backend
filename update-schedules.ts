import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function updateSchedules() {
  console.log('🕐 Updating all class schedules to 2-hour sessions...\n');

  try {
    // Update all classes to have realistic 2-hour session schedules
    const result = await sql`
      UPDATE classes SET schedules = CASE 
        -- Monday/Wednesday Morning Slot 1 (08:00-10:00)
        WHEN id % 9 = 0 THEN '[{"day": "Monday", "startTime": "08:00", "endTime": "10:00"}, {"day": "Wednesday", "startTime": "08:00", "endTime": "10:00"}]'::JSONB
        
        -- Monday/Wednesday Morning Slot 2 (10:00-12:00)
        WHEN id % 9 = 1 THEN '[{"day": "Monday", "startTime": "10:00", "endTime": "12:00"}, {"day": "Wednesday", "startTime": "10:00", "endTime": "12:00"}]'::JSONB
        
        -- Monday/Wednesday Afternoon Slot 1 (13:00-15:00)
        WHEN id % 9 = 2 THEN '[{"day": "Monday", "startTime": "13:00", "endTime": "15:00"}, {"day": "Wednesday", "startTime": "13:00", "endTime": "15:00"}]'::JSONB
        
        -- Monday/Wednesday Afternoon Slot 2 (15:00-17:00)
        WHEN id % 9 = 3 THEN '[{"day": "Monday", "startTime": "15:00", "endTime": "17:00"}, {"day": "Wednesday", "startTime": "15:00", "endTime": "17:00"}]'::JSONB
        
        -- Tuesday/Thursday Morning Slot 1 (08:00-10:00)
        WHEN id % 9 = 4 THEN '[{"day": "Tuesday", "startTime": "08:00", "endTime": "10:00"}, {"day": "Thursday", "startTime": "08:00", "endTime": "10:00"}]'::JSONB
        
        -- Tuesday/Thursday Morning Slot 2 (10:00-12:00)
        WHEN id % 9 = 5 THEN '[{"day": "Tuesday", "startTime": "10:00", "endTime": "12:00"}, {"day": "Thursday", "startTime": "10:00", "endTime": "12:00"}]'::JSONB
        
        -- Tuesday/Thursday Afternoon Slot 1 (13:00-15:00)
        WHEN id % 9 = 6 THEN '[{"day": "Tuesday", "startTime": "13:00", "endTime": "15:00"}, {"day": "Thursday", "startTime": "13:00", "endTime": "15:00"}]'::JSONB
        
        -- Tuesday/Thursday Afternoon Slot 2 (15:00-17:00)
        WHEN id % 9 = 7 THEN '[{"day": "Tuesday", "startTime": "15:00", "endTime": "17:00"}, {"day": "Thursday", "startTime": "15:00", "endTime": "17:00"}]'::JSONB
        
        -- Friday Special Sessions (2-hour sessions for practical courses)
        WHEN id % 9 = 8 THEN '[{"day": "Friday", "startTime": "09:00", "endTime": "11:00"}]'::JSONB
      END;
    `;

    console.log('✅ Schedules updated successfully!\n');

    // Verify the update - show sample of updated schedules
    console.log('📋 Sample of updated schedules:\n');
    
    const sample = await sql`
      SELECT 
        c.id,
        c.name,
        s.name as subject_name,
        c.schedules
      FROM classes c
      JOIN subjects s ON c.subject_id = s.id
      ORDER BY c.id
      LIMIT 16;
    `;

    console.log('ID  | Class Name                              | Schedule');
    console.log('----|----------------------------------------|------------------------------------------');
    
    for (const row of sample) {
      const schedules = row.schedules;
      let scheduleStr = '';
      
      if (Array.isArray(schedules)) {
        const days = schedules.map((s: any) => `${s.day} ${s.startTime}-${s.endTime}`).join(', ');
        scheduleStr = days;
      }
      
      const name = row.name.substring(0, 38).padEnd(38);
      console.log(`${String(row.id).padEnd(3)} | ${name} | ${scheduleStr}`);
    }

    console.log('\n📊 Schedule distribution summary:\n');

    const summary = await sql`
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
    `;

    for (const row of summary) {
      console.log(`   ${row.schedule_pattern.padEnd(25)}: ${String(row.class_count).padStart(3)} classes`);
    }

    console.log('\n✅ All sessions are now 2 hours long!\n');

  } catch (error) {
    console.error('❌ Error updating schedules:', error);
    throw error;
  }
}

updateSchedules().catch(console.error);
