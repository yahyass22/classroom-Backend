import "dotenv/config";
import AgentAPI from "apminsight";
AgentAPI.config()


import express from "express";
import compression from "compression";
import subjectsRouter from "./routes/subjects.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
import authMiddleware from "./middleware/auth.js";
import securityMiddleware from "./middleware/security.js";
import classesRouter from "./routes/classes.js";
import dashboardRouter from "./routes/dashboard.js";
import discussionsRouter from "./routes/discussions.js";
import {toNodeHandler} from "better-auth/node";
import {auth} from "./lib/auth.js";

const app = express();
const PORT = 8000;

app.use(compression());


if (!process.env.FRONTEND_URL) {
   throw new Error("FRONTEND_URL is not defined");
}

console.log("Environment check:");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET ? "Set" : "Missing");

const rawFrontendURL = process.env.FRONTEND_URL!;
const frontendURL = rawFrontendURL.endsWith('/') ? rawFrontendURL.slice(0, -1) : rawFrontendURL;

app.use(cors({
  origin: frontendURL,
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));

// CORS debugging middleware
app.use((req, res, next) => {
  console.log('ðŸŒ CORS Debug:', {
    path: req.path,
    method: req.method,
    origin: req.headers.origin,
    hasCookie: !!req.headers.cookie,
    cookieLength: req.headers.cookie?.length
  });
  next();
});

app.use(express.json());

// Auth routes - mounted before other middleware to skip rate limiting
app.use('/api/auth', toNodeHandler(auth));

const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Debug endpoint to check session (development only)
  app.get('/api/debug-session', authMiddleware, (req, res) => {
    console.log('Debug session request:', {
      hasCookie: !!req.headers.cookie,
      cookieLength: req.headers.cookie?.length,
      origin: req.headers.origin
    });
    const authReq = req as any;
    res.json({
      hasCookie: !!req.headers.cookie,
      cookieLength: req.headers.cookie?.length,
      hasUser: !!authReq.user,
      user: authReq.user ? {
        id: authReq.user.id,
        name: authReq.user.name,
        role: authReq.user.role
      } : null
    });
  });

  // Debug endpoint to check session with auth middleware (development only)
  app.get('/api/debug-auth', authMiddleware, (req: any, res) => {
    const authReq = req as any;
    res.json({
      hasCookie: !!req.headers.cookie,
      cookieLength: req.headers.cookie?.length,
      hasUser: !!authReq.user,
      user: authReq.user ? {
        id: authReq.user.id,
        name: authReq.user.name,
        role: authReq.user.role
      } : null
    });
  });
}

// Security middleware (rate limiting) - runs FIRST to protect against abuse
app.use(securityMiddleware);

// Auth middleware - retrieves session and attaches user to request (uses shared cache)
app.use(authMiddleware);

// IMPORTANT: discussions router must be mounted BEFORE classes router
// because it handles /api/classes/:id/discussions routes
app.use('/api', discussionsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)

app.get("/", (_req, res) => {
  res.send("Welcome to the Classroom API!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth/*`);
  console.log(`Dashboard endpoints available at http://localhost:${PORT}/api/dashboard/*`);
  console.log(`Discussions endpoints available at http://localhost:${PORT}/api/discussions/*`);
  console.log(`Classes endpoints available at http://localhost:${PORT}/api/classes/*`);
});
