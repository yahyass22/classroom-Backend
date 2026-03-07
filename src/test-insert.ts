import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';

config();

async function testQuery() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

  try {
    const stmt = `INSERT INTO classes (subject_id, teacher_id, invite_code, name, capacity, status, schedules, created_at)
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
WHERE s.id IN (1, 2, 6, 7, 11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71)
CROSS JOIN generate_series(1, 2) AS gs`;

    console.log('Executing test INSERT...\n');
    const result = await pool.query(stmt);
    console.log('✓ Success! Rows inserted:', result.rowCount);
    
    const check = await pool.query('SELECT COUNT(*) FROM classes');
    console.log('Total classes:', check.rows[0]?.count);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('Position:', error.position);
  } finally {
    await pool.end();
  }
}

testQuery();
