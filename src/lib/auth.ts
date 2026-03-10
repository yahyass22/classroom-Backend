import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/index.js";
import * as schema from "../db/schema/auth.js";

console.log('🔧 Better-auth configuration:');
console.log('  - Secret:', process.env.BETTER_AUTH_SECRET ? 'Set (' + process.env.BETTER_AUTH_SECRET.length + ' chars)' : 'Missing');
console.log('  - BaseURL:', process.env.BETTER_AUTH_URL);
console.log('  - Frontend URL:', process.env.FRONTEND_URL);
console.log('  - Cookie Name:', 'better-auth.session_token');

const rawBaseURL = process.env.BETTER_AUTH_URL!;
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL.slice(0, -1) : rawBaseURL;

const rawFrontendURL = process.env.FRONTEND_URL!;
const frontendURL = rawFrontendURL.endsWith('/') ? rawFrontendURL.slice(0, -1) : rawFrontendURL;

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL,
    trustedOrigins: [frontendURL],

    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                required: true,
                defaultValue: 'student',
                input: true,
            },
            imageCldPubId: {
                type: 'string',
                required: false,
                input: true,
            }
        }
    },
    session: {
        cookieName: 'better-auth.session_token',
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
        cookies: {
            sessionToken: {
                name: 'better-auth.session_token',
                attributes: {
                    secure: process.env.NODE_ENV === 'production',
                    httpOnly: true,
                    sameSite: 'lax',
                    path: '/',
                    domain: undefined, // Don't set domain for localhost
                }
            }
        }
    }
});