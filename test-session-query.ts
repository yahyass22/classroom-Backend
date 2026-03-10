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

const redactToken = (token?: string | null) => {
  if (!token) return '';
  return `${token.slice(0, 6)}...${token.slice(-4)}`;
};

const maskEmail = (email?: string | null) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return `${local.slice(0, 2)}***`;
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskName = (name?: string | null) => {
  if (!name) return '';
  return `${name.slice(0, 1)}***`;
};

async function testSessionQuery() {
  console.log('Testing direct session query...\n');

  const cookieToken = process.env.TEST_SESSION_TOKEN?.trim() || process.argv[2]?.trim() || '';
  if (!cookieToken) {
    console.error('TEST_SESSION_TOKEN must be set or passed as the first CLI argument.');
    return;
  }

  console.log('Searching for session with token:', redactToken(cookieToken));
  console.log('');

  // Get all sessions with user email
  const allSessions = await db.select({
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
    user: {
      email: user.email,
    }
  }).from(session).leftJoin(user, eq(session.userId, user.id));

  // Find sessions for test@gmail.com
  console.log('Sessions for test@gmail.com:');
  const testSessions = allSessions.filter(s => s.user?.email?.includes('test@gmail') || s.user?.email === 'test@gmail.com');

  for (const s of testSessions) {
    console.log(`  ID: ${s.id}`);
    console.log(`  Token: ${redactToken(s.token)}`);
    console.log(`  Token starts with '6oFi': ${s.token.startsWith('6oFi')}`);
    console.log(`  User ID: ${s.userId}`);
    console.log(`  Expires: ${s.expiresAt}`);
    console.log('');
  }

  // Check if cookie token matches any session
  const decodedCookieToken = decodeURIComponent(cookieToken);
  const tokenPart = decodedCookieToken.split('.')[0];
  console.log('Decoded cookie token:', redactToken(decodedCookieToken));
  console.log('Token part (before dot):', redactToken(tokenPart));

  const matchingSession = allSessions.find(s => s.token === tokenPart || s.token === decodedCookieToken || s.token.startsWith('6oFi'));

  if (matchingSession) {
    console.log('\nFOUND matching session.');
    console.log('  ID:', matchingSession.id);
    console.log('  Token:', redactToken(matchingSession.token));
    console.log('  User ID:', matchingSession.userId);

    // Get the user
    const userData = await db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    }).from(user).where(eq(user.id, matchingSession.userId)).limit(1);

    if (userData.length > 0) {
      console.log('\nUser details:');
      console.log('  Name:', maskName(userData[0].name));
      console.log('  Email:', maskEmail(userData[0].email));
      console.log('  Role:', userData[0].role);
    }
  } else {
    console.log('\nNo matching session found');
    console.log('  Looking for token:', redactToken(tokenPart));
    console.log('  Available tokens for test@gmail.com:');
    testSessions.forEach(s => console.log(`    - ${redactToken(s.token)}`));
  }
}

testSessionQuery().catch(console.error);
