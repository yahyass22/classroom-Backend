import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { and, eq, lt } from 'drizzle-orm';
import { session, user } from './src/db/schema/auth.js';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const maskToken = (token?: string | null) => {
  if (!token) return '';
  const start = token.slice(0, 6);
  const end = token.slice(-4);
  return `${start}...${end}`;
};

const maskEmail = (email?: string | null) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) {
    return `${local.slice(0, 2)}***`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
};

const maskName = (name?: string | null) => {
  if (!name) return '';
  return `${name.slice(0, 1)}***`;
};

async function checkSessions() {
  console.log('ðŸ” Checking active sessions in database...\n');
  
  const filterSessionId = process.env.CHECK_SESSION_ID?.trim();
  const filterUserId = process.env.CHECK_USER_ID?.trim();
  const expiredOnly = process.env.CHECK_EXPIRED_ONLY !== 'false';
  const now = new Date();

  const sessionConditions = [];
  if (filterSessionId) sessionConditions.push(eq(session.id, filterSessionId));
  if (filterUserId) sessionConditions.push(eq(session.userId, filterUserId));
  if (expiredOnly) sessionConditions.push(lt(session.expiresAt, now));

  const sessionWhere = sessionConditions.length > 0 ? and(...sessionConditions) : undefined;
  if (!sessionWhere) {
    throw new Error('Refusing to query all sessions. Set CHECK_EXPIRED_ONLY=true or provide CHECK_SESSION_ID/CHECK_USER_ID.');
  }

  const activeSessions = await db.select({
    id: session.id,
    token: session.token,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  }).from(session).where(sessionWhere);
  
  console.log(`ðŸ“Š Found ${activeSessions.length} sessions in database\n`);
  
  for (const s of activeSessions) {
    const isExpired = new Date(s.expiresAt) < new Date();
    const userData = await db.select({
      id: user.id,
      role: user.role,
    }).from(user).where(eq(user.id, s.userId)).limit(1);
    
    console.log('---');
    console.log(`ðŸŽ« Session ID: ${s.id}`);
    console.log(`ðŸ”‘ Token: ${maskToken(s.token)}`);
    console.log(`â° Expires: ${s.expiresAt}`);
    console.log(`âŒ Expired: ${isExpired ? 'YES' : 'NO'}`);
    if (userData.length > 0) {
      console.log(`ðŸ‘¤ User ID: ${userData[0].id}`);
      console.log(`ðŸŽ­ Role: ${userData[0].role}`);
    }
    console.log('');
  }
}

async function checkUsers() {
  console.log('\nðŸ‘¥ Checking users in database...\n');
  
  const users = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }).from(user).limit(10);
  
  console.log(`ðŸ“Š Found ${users.length} users\n`);
  
  for (const u of users) {
    console.log(`- ${maskName(u.name)} (${maskEmail(u.email)}) - Role: ${u.role}`);
  }
}

async function main() {
  try {
    await checkSessions();
    await checkUsers();
    console.log('\nâœ… Done');
    process.exit(0);
  } catch (error) {
    console.error('âŒ Error:', error);
    process.exit(1);
  }
}

main();


