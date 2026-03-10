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

async function checkSessions() {
  console.log('🔍 Checking active sessions in database...\n');
  
  const activeSessions = await db.select({
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  }).from(session);
  
  console.log(`📊 Found ${activeSessions.length} sessions in database\n`);
  
  for (const s of activeSessions) {
    const isExpired = new Date(s.expiresAt) < new Date();
    const userData = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }).from(user).where(eq(user.id, s.userId)).limit(1);
    
    console.log('---');
    console.log(`🎫 Session ID: ${s.id}`);
    console.log(`🔑 Token: ${s.token.substring(0, 30)}...`);
    console.log(`⏰ Expires: ${s.expiresAt}`);
    console.log(`❌ Expired: ${isExpired ? 'YES' : 'NO'}`);
    if (userData.length > 0) {
      console.log(`👤 User: ${userData[0].name} (${userData[0].email})`);
      console.log(`🎭 Role: ${userData[0].role}`);
    }
    console.log('');
  }
}

async function checkUsers() {
  console.log('\n👥 Checking users in database...\n');
  
  const users = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }).from(user).limit(10);
  
  console.log(`📊 Found ${users.length} users\n`);
  
  for (const u of users) {
    console.log(`- ${u.name} (${u.email}) - Role: ${u.role}`);
  }
}

async function main() {
  try {
    await checkSessions();
    await checkUsers();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
