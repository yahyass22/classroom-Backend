import { Pool } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMegaSeed() {
  console.log('🌱 Starting MEGA database seed...\n');
  
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const seedFilePath = join(__dirname, '..', 'seed-mega.sql');
    const seedSQL = readFileSync(seedFilePath, 'utf-8');

    // Split by double newlines to get logical sections
    const sections = seedSQL.split(/\n\s*\n(?=--\s*={10,})/);
    
    console.log(`📄 Found ${sections.length} sections to execute...\n`);

    let stmtCount = 0;
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      
      if (!section) continue;
      
      // Extract section title
      const lines = section.split('\n');
      const titleLine = lines.find(l => l.includes('STEP'));
      if (titleLine) {
        console.log(`\n${titleLine.replace('--', '').trim()}`);
      }

      // Split section into individual statements by semicolon
      const statements = section.split(';');
      
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        // Skip empty statements and pure comment lines
        if (!trimmed || trimmed.split('\n').every(line => line.trim().startsWith('--') || line.trim() === '')) continue;
        
        // Remove comment lines from the statement
        const cleanedStmt = trimmed.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
        if (!cleanedStmt) continue;
        
        try {
          const result = await pool.query(cleanedStmt);
          const stmtType = cleanedStmt.split(' ')[0]?.toUpperCase();
          
          if (stmtType === 'INSERT' || stmtType === 'DELETE') {
            console.log(`  ✓ ${stmtType}: ${result?.rowCount ?? 0} rows`);
          } else if (stmtType === 'ALTER') {
            console.log(`  ✓ ${stmtType}: Table modified`);
          }
          stmtCount++;
        } catch (error: any) {
          console.error(`  ❌ Error:`, error.message);
          console.error('  Statement:', cleanedStmt.substring(0, 200) + '...');
          throw error;
        }
      }
    }

    console.log(`\n✅ MEGA seed completed! (${stmtCount} statements executed)\n`);
    
    // Summary statistics
    console.log('📊 Summary Statistics:');
    console.log('='.repeat(50));
    
    const stats = await pool.query(`
      SELECT 'Users' as category, COUNT(*)::int as count FROM "user"
      UNION ALL SELECT 'Students', COUNT(*)::int FROM "user" WHERE role = 'student'
      UNION ALL SELECT 'Teachers', COUNT(*)::int FROM "user" WHERE role = 'teacher'
      UNION ALL SELECT 'Admins', COUNT(*)::int FROM "user" WHERE role = 'admin'
      UNION ALL SELECT 'Departments', COUNT(*)::int FROM departments
      UNION ALL SELECT 'Subjects', COUNT(*)::int FROM subjects
      UNION ALL SELECT 'Classes (Total)', COUNT(*)::int FROM classes
      UNION ALL SELECT 'Classes (Active)', COUNT(*)::int FROM classes WHERE status = 'active'
      UNION ALL SELECT 'Classes (Inactive)', COUNT(*)::int FROM classes WHERE status = 'inactive'
      UNION ALL SELECT 'Classes (Archived)', COUNT(*)::int FROM classes WHERE status = 'archived'
      UNION ALL SELECT 'Enrollments', COUNT(*)::int FROM enrollments
      UNION ALL SELECT 'Teacher-Subject Links', COUNT(*)::int FROM teacher_subjects
      ORDER BY 2 DESC;
    `);

    stats.rows.forEach(row => {
      console.log(`   ${row.category.padEnd(30)}: ${row.count.toLocaleString()}`);
    });

    console.log('\n📈 Enrollment by Month (Academic Year 2024-2025):');
    console.log('='.repeat(50));
    
    const monthlyStats = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as enrollments
      FROM enrollments
      GROUP BY 1
      ORDER BY 1;
    `);

    monthlyStats.rows.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.enrollments / 50));
      console.log(`   ${row.month}: ${row.enrollments.toLocaleString().padStart(5)} ${bar}`);
    });

    console.log('\n🏫 Top 10 Departments by Enrollment:');
    console.log('='.repeat(50));
    
    const deptStats = await pool.query(`
      SELECT 
        d.name as department,
        COUNT(*) as total_enrollments
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      JOIN departments d ON s.department_id = d.id
      GROUP BY d.id, d.name
      ORDER BY total_enrollments DESC
      LIMIT 10;
    `);

    deptStats.rows.forEach((row, idx) => {
      console.log(`   ${idx + 1}. ${row.department.padEnd(35)}: ${row.total_enrollments.toLocaleString()}`);
    });

    console.log('\n⚠️  At-Risk Resources:');
    console.log('='.repeat(50));
    
    const atRiskStats = await pool.query(`
      SELECT 'At-Risk Classes (Active, 0 Enrolled)' as type, COUNT(*)::int as count
      FROM (
        SELECT c.id
        FROM classes c
        LEFT JOIN enrollments e ON c.id = e.class_id
        WHERE c.status = 'active'
        GROUP BY c.id
        HAVING COUNT(e.student_id) = 0
      ) sub
      UNION ALL
      SELECT 'At-Risk Teachers (No Subjects)', COUNT(*)::int
      FROM teachers t
      LEFT JOIN teacher_subjects ts ON t.id = ts.teacher_id
      WHERE ts.subject_id IS NULL;
    `);

    atRiskStats.rows.forEach(row => {
      console.log(`   ${row.type.padEnd(40)}: ${row.count}`);
    });

    console.log('\n🎉 All dashboard charts now have data to display!');

  } catch (error) {
    console.error('❌ Error during seed:', error);
    throw error;
  } finally {
    await pool.end();
    console.log('\n✅ Database connection closed.');
  }
}

runMegaSeed().catch(console.error);
