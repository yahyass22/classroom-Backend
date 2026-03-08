import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";
import type { IncomingHttpHeaders } from "http";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: 'student' | 'teacher' | 'admin';
        image?: string | null | undefined;
    };
}

// Simple LRU cache for sessions (max 1000 entries)
interface CachedSession {
    user: {
        id: string;
        name: string;
        email: string;
        role: 'student' | 'teacher' | 'admin';
        image?: string | null | undefined;
    };
    expiresAt: number; // Local TTL expiry
    providerExpiresAt: number; // Real provider session expiry
}

const sessionCache = new Map<string, CachedSession>();
const CACHE_MAX_SIZE = 1000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes local cache TTL

/**
 * Convert IncomingHttpHeaders to Headers-like object
 */
function headersToHeadersObj(headers: IncomingHttpHeaders): { get(name: string): string | null } {
    return {
        get: (name: string) => {
            const value = headers[name.toLowerCase()];
            if (Array.isArray(value)) {
                return value[0] ?? null;
            }
            return value ?? null;
        }
    };
}

/**
 * Get session from cache or fetch from auth API
 */
export async function getSessionFromHeaders(
    headers: IncomingHttpHeaders, 
    options: { forceFresh?: boolean } = {}
): Promise<CachedSession | null> {
    // Try to get session token from headers
    const authHeader = headers.authorization;
    const cookieHeader = headers.cookie;
    const sessionToken = (typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : '') || 
                         (typeof cookieHeader === 'string' ? cookieHeader.match(/better-auth.session_token=([^;]+)/)?.[1] : '') ||
                         '';

    if (!sessionToken) {
        return null;
    }

    // Check cache first (unless forceFresh is requested)
    if (!options.forceFresh) {
        const cached = sessionCache.get(sessionToken);
        // Ensure BOTH the local TTL and the provider's expiry are still valid
        if (cached && cached.expiresAt > Date.now() && cached.providerExpiresAt > Date.now()) {
            return cached;
        }
    }

    // Fetch from auth API (fresh session)
    try {
        const headersObj = headersToHeadersObj(headers);
        const session = await auth.api.getSession({ 
            headers: headersObj as any 
        });
        
        if (!session?.user || !session?.session) {
            // If we're here and forceFresh was true, it means session is truly gone/revoked
            if (options.forceFresh) {
                sessionCache.delete(sessionToken);
            }
            return null;
        }

        const providerExpiresAt = new Date(session.session.expiresAt).getTime();
        
        // If provider session already expired, don't cache
        if (providerExpiresAt <= Date.now()) {
            sessionCache.delete(sessionToken);
            return null;
        }

        const cachedSession: CachedSession = {
            user: {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: (session.user.role as 'student' | 'teacher' | 'admin') || 'student',
                image: session.user.image ?? undefined,
            },
            expiresAt: Date.now() + CACHE_TTL_MS,
            providerExpiresAt,
        };

        // Add to cache (with LRU eviction)
        if (sessionCache.size >= CACHE_MAX_SIZE) {
            const firstKey = sessionCache.keys().next().value;
            if (firstKey) {
                sessionCache.delete(firstKey);
            }
        }

        sessionCache.set(sessionToken, cachedSession);
        return cachedSession;
    } catch (error) {
        console.error("getSession error:", error);
        return null;
    }
}

/**
 * Authentication middleware that retrieves the session and attaches the user to the request
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // We can check if this route specifically needs a fresh session for role changes
        // For now, we perform a standard session retrieval which uses the cache
        // but validates it against the provider's expiry.
        const cachedSession = await getSessionFromHeaders(req.headers);

        if (cachedSession?.user) {
            // Attach user to request for downstream middleware/routes
            (req as AuthRequest).user = cachedSession.user;
        }

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        // Don't fail the request, just continue without user context
        next();
    }
};

/**
 * Middleware that forces a fresh session check (bypassing cache) 
 * for critical operations or authorization-sensitive flows.
 */
export const requireFreshAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const cachedSession = await getSessionFromHeaders(req.headers, { forceFresh: true });

        if (cachedSession?.user) {
            (req as AuthRequest).user = cachedSession.user;
            next();
        } else {
            res.status(401).json({ error: 'Unauthorized', message: 'Session expired or invalid. Please sign in again.' });
        }
    } catch (error) {
        console.error("Fresh auth middleware error:", error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
};

export default authMiddleware;
