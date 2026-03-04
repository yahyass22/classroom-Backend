import "dotenv/config";
import AgentAPI from "apminsight";
AgentAPI.config()


import express from "express";
import subjectsRouter from "./routes/subjects.js";
import usersRouter from "./routes/users.js";
import cors from "cors";
import securityMiddleware from "./middleware/security.js";
import classesRouter from "./routes/classes.js";
import dashboardRouter from "./routes/dashboard.js";
import {toNodeHandler} from "better-auth/node";
import {auth} from "./lib/auth.js";

const app = express();
const PORT = 8000;


if (!process.env.FRONTEND_URL) {
   throw new Error("FRONTEND_URL is not defined");
}

console.log("Environment check:");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.log("BETTER_AUTH_SECRET:", process.env.BETTER_AUTH_SECRET ? "Set" : "Missing");

app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET','POST','PUT','DELETE'],
  credentials: true
}));

app.use(express.json());

// Auth routes - mounted before security middleware to skip rate limiting
app.use('/api/auth', toNodeHandler(auth));

app.use(securityMiddleware);

app.use('/api/dashboard', dashboardRouter);
app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes',classesRouter)

app.get("/", (_req, res) => {
  res.send("Welcome to the Classroom API!");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Auth endpoints available at http://localhost:${PORT}/api/auth/*`);
  console.log(`Dashboard endpoints available at http://localhost:${PORT}/api/dashboard/*`);
});
