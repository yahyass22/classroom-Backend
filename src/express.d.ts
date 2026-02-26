import { User } from "./db/schema/auth";

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