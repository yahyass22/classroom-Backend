import { aj } from "../config/arcjet.js";
import { Request, Response, NextFunction } from "express";
import {ArcjetNodeRequest, slidingWindow} from "@arcjet/node";
import { getSessionFromHeaders, type AuthRequest } from "./auth.js";

type RateLimitRole = 'admin' | 'teacher' | 'student' | 'guest';

/**
 * Get user role from session cache or headers for rate limiting
 * This runs BEFORE authMiddleware, so it uses its own lightweight cache lookup
 */
async function getUserRole(req: Request): Promise<RateLimitRole> {
    // Try to get role from request (if authMiddleware already ran)
    const authReq = req as AuthRequest;
    if (authReq.user?.role) {
        return authReq.user.role;
    }

    // Fall back to session cache lookup
    try {
        const cachedSession = await getSessionFromHeaders(req.headers);
        return cachedSession?.user?.role ?? 'guest';
    } catch {
        return 'guest';
    }
}

const securityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Skip rate limiting in development and test environments
    if(process.env.NODE_ENV === 'test' || process.env.ARCJET_ENV === 'development') {
        return next();
    }

    try {
        const role: RateLimitRole = await getUserRole(req);

        let limit: number;
        let message: string;

        switch (role) {
            case 'admin':
                limit = 20;
                message = 'Admin request limit exceeded (20 per minute). Slow down.';
                break;
            case 'teacher':
            case 'student':
                limit = 10;
                message = 'User request limit exceeded (10 per minute). Please wait.';
                break;
            default:
                limit = 5;
                message = 'Guest request limit exceeded (5 per minute). Please sign up for higher limits.';
                break;
        }
        const client = aj.withRule(
            slidingWindow({
                mode:'LIVE',
                interval: "1m",
                max: limit,
            })
        )
        const arcjetRequest:ArcjetNodeRequest={
            headers: req.headers,
            method: req.method,
            url: req.originalUrl ?? req.url,
            socket: {remoteAddress: req.socket.remoteAddress ?? req.ip ?? '0.0.0.0'},
        }
        const decision = await client.protect(arcjetRequest);
        if (decision.isDenied()&& decision.reason.isBot()) {
            return res.status(403).json({error: 'Unauthorized', message:'Automated requests are not allowed'});
        }
        if (decision.isDenied()&& decision.reason.isShield()) {
            return res.status(403).json({error: 'Unauthorized', message:'Request blocked by security Policy'});
        }
        if (decision.isDenied()&& decision.reason.isRateLimit()) {
            return res.status(429).json({error: 'Too many requests', message});
        }
        next();

    } catch (e) {
        console.error("Arcjet security middleware error:", e);
        return res.status(500).json({error:'Internal error',message:'Something went wrong with security middleware'});
    }
};
export default securityMiddleware;
