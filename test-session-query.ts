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

async function testSessionQuery() {
  console.log('🔍 Testing direct session query...\n');
  
  // The NEW token from your cookie
  const cookieToken = '6oFiTJrqQ59GVXR0edtz6JJkzgIZnnsZ.ulqa5%2FUlrnKotB%2FqyPQEMg2K2KyOUPgDAZPi0';
  
  console.log('📝 Searching for session with token:', cookieToken.substring(0, 50));
  console.log('');
  
  // Get all sessions
  const allSessions = await db.select({
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
  }).from(session);
  
  // Find sessions for test@gmail.com
  console.log('📧 Sessions for test@gmail.com:');
  const testSessions = allSessions.filter(s => s.userId.includes('test@gmail') || s.userId === 'test@gmail.com');
  
  for (const s of testSessions) {
    console.log(`  ID: ${s.id}`);
    console.log(`  Token: ${s.token}`);
    console.log(`  Token starts with '6oFi': ${s.token.startsWith('6oFi')}`);
    console.log(`  User ID: ${s.userId}`);
    console.log(`  Expires: ${s.expiresAt}`);
    console.log('');
  }
  
  // Check if cookie token matches any session
  const decodedCookieToken = decodeURIComponent(cookieToken);
  const tokenPart = decodedCookieToken.split('.')[0];
  console.log('🔍 Decoded cookie token:', decodedCookieToken.substring(0, 50));
  console.log('🔍 Token part (before dot):', tokenPart);
  
  const matchingSession = allSessions.find(s => s.token === tokenPart || s.token === decodedCookieToken || s.token.startsWith('6oFi'));
  
  if (matchingSession) {
    console.log('\n✅ FOUND matching session!');
    console.log('  ID:', matchingSession.id);
    console.log('  Token:', matchingSession.token);
    console.log('  User ID:', matchingSession.userId);
    
    // Get the user
    const userData = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }).from(user).where(eq(user.id, matchingSession.userId)).limit(1);
    
    if (userData.length > 0) {
      console.log('\n👤 User details:');
      console.log('  Name:', userData[0].name);
      console.log('  Email:', userData[0].email);
      console.log('  Role:', userData[0].role);
    }
  } else {
    console.log('\n❌ No matching session found');
    console.log('   Looking for token:', tokenPart);
    console.log('   Available tokens for test@gmail.com:');
    testSessions.forEach(s => console.log(`     - ${s.token}`));
  }
}

testSessionQuery().catch(console.error);
