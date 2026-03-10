import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { session, user } from './src/db/schema/auth.js';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function testBetterAuthQuery() {
  console.log('🔍 Testing better-auth session query format...\n');
  
  // The token we're looking for
  const tokenToFind = '6oFiTJrqQ59GVXR0edtz6JJkzgIZnnsZ';
  
  console.log('📝 Token to find:', tokenToFind);
  console.log('');
  
  // Query 1: Direct equality check (how better-auth should query)
  console.log('Query 1: SELECT * FROM session WHERE token = ?');
  const result1 = await db.select().from(session).where(eq(session.token, tokenToFind));
  console.log(`   Found: ${result1.length} rows`);
  if (result1.length > 0) {
    console.log('   ✅ Session found!');
    console.log('   ID:', result1[0].id);
    console.log('   Token:', result1[0].token);
    console.log('   User ID:', result1[0].userId);
    console.log('   Expires:', result1[0].expiresAt);
  } else {
    console.log('   ❌ Session NOT found!');
  }
  console.log('');
  
  // Query 2: Check what's in the session table for this user
  console.log('Query 2: All sessions for siraj@hotmail.com user:');
  const userResult = await db.select({
    id: user.id,
    email: user.email,
    name: user.name
  }).from(user).where(eq(user.email, 'siraj@hotmail.com'));
  
  if (userResult.length > 0) {
    const userId = userResult[0].id;
    console.log('   User ID:', userId);
    
    const userSessions = await db.select().from(session).where(eq(session.userId, userId));
    console.log(`   Found ${userSessions.length} sessions for this user:`);
    userSessions.forEach((s, i) => {
      console.log(`     ${i + 1}. Token: ${s.token} | Expires: ${s.expiresAt}`);
    });
  }
  console.log('');
  
  // Query 3: Check schema
  console.log('Query 3: Session table structure:');
  console.log('   Columns:', Object.keys(session));
}

testBetterAuthQuery().catch(console.error);
