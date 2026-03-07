import { Request, Response, NextFunction } from "express";
import { auth } from "../lib/auth.js";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        name: string;
        email: string;
        role: 'student' | 'teacher' | 'admin';
        image?: string | null | undefined;
    };
}

/**
 * Authentication middleware that retrieves the session and attaches the user to the request
 */
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get session from headers (cookies or authorization header)
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (session?.user) {
            // Attach user to request for downstream middleware/routes
            (req as AuthRequest).user = {
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                role: (session.user.role as 'student' | 'teacher' | 'admin') || 'student',
                image: session.user.image ?? undefined,
            };
        }

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        // Don't fail the request, just continue without user context
        next();
    }
};

export default authMiddleware;
