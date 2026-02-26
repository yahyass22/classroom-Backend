import { User } from "./db/schema/auth.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                role?: "admin" | "teacher" | "student";
            };
        }
    }
}
export {}