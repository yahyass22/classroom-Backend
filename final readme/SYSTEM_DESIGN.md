# 🏗️ System Design Document

Comprehensive system architecture and design documentation for the Classroom Backend API.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagrams](#architecture-diagrams)
- [Component Design](#component-design)
- [Data Flow](#data-flow)
- [API Gateway Pattern](#api-gateway-pattern)
- [Authentication Flow](#authentication-flow)
- [Database Design](#database-design)
- [Caching Strategy](#caching-strategy)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)

---

## System Overview

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT                                         │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │  Frontend Application (React + Vite + TypeScript)                          │  │
│  │  Port: 5173                                                                │  │
│  │                                                                            │  │
│  │  Components:                                                               │  │
│  │  • Dashboard Analytics                                                     │  │
│  │  • Class Management                                                        │  │
│  │  • Discussion Forums                                                       │  │
│  │  • User Profiles                                                           │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ HTTPS
                                        │ Cookies: better-auth.session_token
                                        │ Content-Type: application/json
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              API SERVER (Express.js)                             │
│  Port: 8000                                                                      │
│  Environment: Node.js 20+ (ESM)                                                  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                           MIDDLEWARE STACK                                  │  │
│  │                                                                            │  │
│  │  1. Compression (gzip)                                                     │  │
│  │  2. CORS (Credentials enabled)                                             │  │
│  │  3. JSON Parser                                                            │  │
│  │  4. Arcjet Security (Rate Limiting, Bot Detection, Shield)                 │  │
│  │  5. Auth Middleware (Session validation, LRU cache)                        │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │                              ROUTE HANDLERS                                 │  │
│  │                                                                            │  │
│  │  /api/auth/*         → Better Auth Handler                                 │  │
│  │  /api/dashboard/*    → Dashboard Analytics (10 endpoints)                  │  │
│  │  /api/classes/*      → Class Management (3 endpoints)                      │  │
│  │  /api/subjects/*     → Subject Listing                                     │  │
│  │  /api/users/*        → User Listing                                        │  │
│  │  /api/discussions/*  → Discussion Forum (20+ endpoints)                    │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        │ Drizzle ORM
                                        │ Connection Pooling (Neon)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (Neon PostgreSQL)                              │
│                                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐               │
│  │   Auth Schema    │  │    App Schema    │  │ Discussion Schema│               │
│  │                  │  │                  │  │                  │               │
│  │  • user          │  │  • departments   │  │  • discussions   │               │
│  │  • session       │  │  • subjects      │  │  • replies       │               │
│  │  • account       │  │  • teachers      │  │  • views         │               │
│  │  • verification  │  │  • classes       │  │  • votes         │               │
│  │                  │  │  • enrollments   │  │  │               │               │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘               │
│                                                                                  │
│  Features:                                                                       │
│  • Serverless PostgreSQL                                                         │
│  • Connection pooling                                                            │
│  • Branching support                                                             │
│  • Auto-scaling                                                                  │
│  └──────────────────┘                                                            │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagrams

### 1. Request-Response Flow

```
┌─────────┐
│  Client │
└────┬────┘
     │ 1. HTTP Request (POST /api/classes/:id/discussions)
     │    Headers: Cookie=better-auth.session_token=abc123...
     │    Body: { title, content, type }
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Middleware Stack                   │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. CORS Middleware                                        │  │
│  │    - Check origin against trustedOrigins                  │  │
│  │    - Set Access-Control-Allow-Credentials: true           │  │
│  │    - Log: 🌐 CORS Debug: { path, method, origin, ... }    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 2. Arcjet Security Middleware                             │  │
│  │    - Extract user role from session                       │  │
│  │    - Apply rate limit (Admin: 20, Teacher: 10, Guest: 5)  │  │
│  │    - Bot detection                                        │  │
│  │    - SQL injection shield                                 │  │
│  │    - Return 429/403 if blocked                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                          │                                       │
│                          ▼                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 3. Auth Middleware                                        │  │
│  │    - Parse cookie: better-auth.session_token              │  │
│  │    - Check LRU cache (1000 entries, 5min TTL)             │  │
│  │    - If cache miss: call auth.api.getSession()            │  │
│  │    - Validate session expiry (provider + local)           │  │
│  │    - Attach user to request: req.user = { id, role, ... } │  │
│  │    - Log: 🔐 Auth Middleware: { userId, userRole }        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Route Handler                              │
│  POST /api/classes/:classId/discussions                         │
│                                                                  │
│  1. Validate request body (title, content required)             │
│  2. Check authentication (req.user exists)                      │
│  3. Verify class exists (SELECT FROM classes WHERE id = ?)      │
│  4. Create discussion (INSERT INTO discussions ...)             │
│  5. Return 201 Created                                          │
└─────────────────────────────────────────────────────────────────┘
     │
     │ 201 Created
     │ { data: { id, title, content, ... } }
     ▼
┌─────────┐
│  Client │
└─────────┘
```

### 2. Authentication Flow

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
└────┬─────┘                              └────┬─────┘
     │                                        │
     │  POST /api/auth/sign-in/email          │
     │  { email, password }                   │
     │───────────────────────────────────────►│
     │                                        │
     │                                        │  Validate credentials
     │                                        │  (Better Auth)
     │                                        │
     │                                        │  Generate session token
     │                                        │  Store in DB (session table)
     │                                        │
     │  Set-Cookie: better-auth.session_token │
     │  Path: /; HttpOnly; SameSite=lax       │
     │◄───────────────────────────────────────│
     │                                        │
     │  Store cookie in browser               │
     │                                        │
     │                                        │
     │  Subsequent Request                    │
     │  (with cookie)                         │
     │───────────────────────────────────────►│
     │                                        │
     │                                        │  Parse cookie
     │                                        │  Check LRU cache
     │                                        │
     │                                        │  ┌─────────────┐
     │                                        │  │ Cache Hit?  │
     │                                        │  └──────┬──────┘
     │                                        │         │
     │                                        │    Yes  │  No
     │                                        │    ┌────┴─────┐
     │                                        │    │          │
     │                                        │    ▼          ▼
     │                                        │  Return    Call auth.api
     │                                        │  cached    .getSession()
     │                                        │  session       │
     │                                        │                │
     │                                        │                ▼
     │                                        │          Query DB
     │                                        │          (session table)
     │                                        │                │
     │                                        │                ▼
     │                                        │          Cache result
     │                                        │                │
     │                                        │                ▼
     │                                        │          Return user
     │                                        │
     │                                        │  Attach req.user
     │                                        │  Continue to route
     │                                        │
     │  Response (protected data)             │
     │◄───────────────────────────────────────│
     │                                        │
```

### 3. Session Caching Strategy (LRU)

```
┌─────────────────────────────────────────────────────────────────┐
│                    LRU Session Cache                             │
│  Max Size: 1000 entries                                         │
│  TTL: 5 minutes (300,000 ms)                                    │
│  Eviction: Least Recently Used                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  sessionCache (Map<string, CachedSession>)               │   │
│  │                                                          │   │
│  │  Key: sessionToken (string)                              │   │
│  │  Value: {                                                │   │
│  │    user: { id, name, email, role, image },               │   │
│  │    expiresAt: number (local TTL),                        │   │
│  │    providerExpiresAt: number (real session expiry)       │   │
│  │  }                                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Cache Lookup Flow:                                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Check if sessionToken exists in cache               │    │
│  │           │                                             │    │
│  │           ▼                                             │    │
│  │  2. Validate local TTL (expiresAt > Date.now())         │    │
│  │           │                                             │    │
│  │           ▼                                             │    │
│  │  3. Validate provider TTL (providerExpiresAt > now)     │    │
│  │           │                                             │    │
│  │           ▼                                             │    │
│  │  4. If valid: return cached session                     │    │
│  │     If invalid: delete from cache, fetch fresh          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Cache Eviction (when size >= 1000):                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  1. Get first key (oldest entry)                        │    │
│  │  2. Delete from cache                                   │    │
│  │  3. Add new entry                                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. Middleware Components

#### Security Middleware (Arcjet)

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                    Security Middleware                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: Express Request                                         │
│  Output: Pass to next middleware OR Return error response       │
│                                                                  │
│  Steps:                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Check environment (skip in test/development)           │  │
│  │ 2. Get user role from session cache                       │  │
│  │ 3. Determine rate limit:                                  │  │
│  │    - Admin: 20 req/min                                    │  │
│  │    - Teacher/Student: 10 req/min                          │  │
│  │    - Guest: 5 req/min                                     │  │
│  │ 4. Create Arcjet request object                           │  │
│  │ 5. Call client.protect()                                  │  │
│  │ 6. Check decision:                                        │  │
│  │    - isDenied() + isBot()     → 403 Forbidden             │  │
│  │    - isDenied() + isShield()  → 403 Forbidden             │  │
│  │    - isDenied() + isRateLimit() → 429 Too Many Requests   │  │
│  │    - Otherwise → next()                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

#### Auth Middleware

```typescript
┌─────────────────────────────────────────────────────────────────┐
│                      Auth Middleware                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Input: Express Request                                         │
│  Output: Request with req.user attached OR Continue without user│
│                                                                  │
│  Steps:                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Extract session token from:                            │  │
│  │    - Cookie: better-auth.session_token                    │  │
│  │    - OR Authorization: Bearer <token>                     │  │
│  │ 2. Check LRU cache                                        │  │
│  │ 3. If cache miss or expired:                              │  │
│  │    - Call auth.api.getSession()                           │  │
│  │    - Cache result (if valid)                              │  │
│  │ 4. If session valid:                                      │  │
│  │    - Attach user to request: req.user = { ... }           │  │
│  │    - Log: 🔐 Auth Middleware: { userId, userRole }        │  │
│  │ 5. next() (always continue, even without auth)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Route Handler Components

#### Dashboard Routes

```
┌─────────────────────────────────────────────────────────────────┐
│                    Dashboard Router                              │
│  Base Path: /api/dashboard                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET /stats                                                     │
│  ├─ Query user count (role='student')                           │
│  ├─ Query classes count (status='active')                       │
│  ├─ Query teachers count                                        │
│  ├─ Query subjects count                                        │
│  └─ Return aggregated stats                                     │
│                                                                  │
│  GET /enrollment-trends                                         │
│  ├─ Group enrollments by month (to_char)                        │
│  ├─ Order by month                                              │
│  └─ Return monthly trends                                       │
│                                                                  │
│  GET /recent-classes                                            │
│  ├─ Join classes + subjects + user + enrollments                │
│  ├─ Order by createdAt DESC                                     │
│  ├─ Limit 10                                                    │
│  └─ Return with enrollment count                                │
│                                                                  │
│  GET /enrollment-by-department                                  │
│  ├─ Join enrollments + classes + subjects + departments         │
│  ├─ Group by department + month                                 │
│  └─ Return department-wise monthly data                         │
│                                                                  │
│  GET /student-department-distribution                           │
│  ├─ Left join departments → subjects → classes → enrollments    │
│  ├─ Group by department                                         │
│  ├─ Having count > 0                                            │
│  └─ Return distribution                                         │
│                                                                  │
│  GET /class-status-distribution                                 │
│  ├─ Group classes by status                                     │
│  └─ Return counts (active/inactive/archived)                    │
│                                                                  │
│  GET /at-risk                                                   │
│  ├─ Query orphaned classes (active, 0 enrollments)              │
│  ├─ Query unassigned teachers (no subjects)                     │
│  └─ Return combined list                                        │
│                                                                  │
│  GET /schedule-heatmap                                          │
│  ├─ Query active classes with schedules                         │
│  ├─ Parse JSONB schedules                                       │
│  ├─ Flatten to day/time slots                                   │
│  └─ Return routine data                                         │
│                                                                  │
│  GET /top-teachers                                              │
│  ├─ Join teachers + departments + user + classes + enrollments  │
│  ├─ Group by teacher                                            │
│  ├─ Order by class count DESC                                   │
│  ├─ Limit 10                                                    │
│  └─ Return with student count                                   │
│                                                                  │
│  GET /user-signup-trends                                        │
│  ├─ Group users by month + role                                 │
│  ├─ Filter by student/teacher                                   │
│  └─ Return monthly signups                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Create Discussion Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ POST /api/classes/149/discussions
     │ Cookie: better-auth.session_token=abc123...
     │ Body: { title: "Help", content: "...", type: "question" }
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  CORS Middleware                                                │
│  - Log: 🌐 CORS Debug: { path, method, origin, hasCookie }     │
│  - Set CORS headers                                             │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Arcjet Security Middleware                                     │
│  - Get user role from session cache                             │
│  - Apply rate limit (10 req/min for student)                    │
│  - Check bot detection                                          │
│  - Check SQL injection shield                                   │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Auth Middleware                                                │
│  - Parse cookie: better-auth.session_token                      │
│  - Check LRU cache (miss)                                       │
│  - Call auth.api.getSession()                                   │
│  - Cache result: { user: { id, role: 'student', ... } }         │
│  - Attach req.user                                              │
│  - Log: 🔐 Auth Middleware: { userId, userRole: 'student' }    │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route Handler: POST /api/classes/:classId/discussions          │
│                                                                  │
│  1. Validate request body                                       │
│     - Check title, content exist                                │
│     - Return 400 if missing                                     │
│                                                                  │
│  2. Check authentication                                        │
│     - if (!req.user) return 401                                 │
│                                                                  │
│  3. Verify class exists                                         │
│     - SELECT id, name FROM classes WHERE id = 149               │
│     - Return 404 if not found                                   │
│                                                                  │
│  4. Create discussion                                           │
│     - INSERT INTO discussions (...)                             │
│     - VALUES (classId, authorId, title, content, type, ...)     │
│     - RETURNING *                                               │
│                                                                  │
│  5. Return 201 Created                                          │
│     - { data: { id, title, content, ... } }                     │
└─────────────────────────────────────────────────────────────────┘
     │
     │ 201 Created
     │ { data: { id: 1, title: "Help", ... } }
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

### 2. Dashboard Analytics Query Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │
     │ GET /api/dashboard/stats
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Middleware Stack (CORS → Security → Auth)                      │
│  (Same as above, skipped for brevity)                           │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Route Handler: GET /api/dashboard/stats                        │
│                                                                  │
│  Parallel Queries:                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Query 1: Total Students                                   │  │
│  │ SELECT count(*) FROM "user" WHERE role = 'student'        │  │
│  │ Result: [{ count: 500 }]                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Query 2: Total Active Classes                             │  │
│  │ SELECT count(*) FROM classes WHERE status = 'active'      │  │
│  │ Result: [{ count: 158 }]                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Query 3: Total Teachers                                   │  │
│  │ SELECT count(*) FROM teachers                             │  │
│  │ Result: [{ count: 60 }]                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Query 4: Total Subjects                                   │  │
│  │ SELECT count(*) FROM subjects                             │  │
│  │ Result: [{ count: 75 }]                                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Query 5: Total Enrollments                                │  │
│  │ SELECT count(*) FROM enrollments                          │  │
│  │ Result: [{ count: 4848 }]                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Aggregate Results:                                             │
│  {                                                              │
│    totalStudents: 500,                                          │
│    totalClasses: 158,                                           │
│    totalTeachers: 60,                                           │
│    totalSubjects: 75,                                           │
│    totalEnrollments: 4848                                       │
│  }                                                              │
│                                                                  │
│  Return 200 OK                                                  │
└─────────────────────────────────────────────────────────────────┘
     │
     │ 200 OK
     │ { totalStudents: 500, totalClasses: 158, ... }
     ▼
┌──────────┐
│  Client  │
└──────────┘
```

---

## API Gateway Pattern

While not using a dedicated API gateway, the Express server implements gateway-like patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    API Gateway Pattern                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Request Routing                                          │  │
│  │                                                           │  │
│  │  /api/auth/*          → Better Auth Handler              │  │
│  │  /api/dashboard/*     → Dashboard Router                 │  │
│  │  /api/classes/*       → Classes Router                   │  │
│  │  /api/subjects/*      → Subjects Router                  │  │
│  │  /api/users/*         → Users Router                     │  │
│  │  /api/discussions/*   → Discussions Router               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Cross-Cutting Concerns                                   │  │
│  │                                                           │  │
│  │  • Authentication (shared middleware)                     │  │
│  │  • Rate Limiting (Arcjet)                                 │  │
│  │  • CORS (configured once)                                 │  │
│  │  • Compression (gzip)                                     │  │
│  │  • Error Handling (try-catch in routes)                   │  │
│  │  • Logging (console + debug endpoints)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Response Standardization                                 │  │
│  │                                                           │  │
│  │  Success: { data: ... }                                   │  │
│  │  Error:   { error: string, details?: string }             │  │
│  │  Pagination: { data: [...], pagination: { ... } }         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow

### Detailed Session Management

```
┌─────────────────────────────────────────────────────────────────┐
│                 Better-Auth Session Management                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Session Creation (Login):                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. User submits email/password                            │  │
│  │ 2. Better Auth validates credentials                      │  │
│  │ 3. Generate session token (random, 32+ chars)             │  │
│  │ 4. Store in database:                                     │  │
│  │    INSERT INTO session (id, token, userId, expiresAt, ...)│  │
│  │ 5. Set cookie:                                            │  │
│  │    Set-Cookie: better-auth.session_token=<token>          │  │
│  │    Path=/; HttpOnly; SameSite=lax; Secure=prod            │  │
│  │ 6. Session expires in 7 days                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Session Validation (Each Request):                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Extract token from cookie                              │  │
│  │ 2. Check LRU cache (key=token)                            │  │
│  │ 3. If cache hit AND valid:                                │  │
│  │    - Check local TTL (5 min)                              │  │
│  │    - Check provider TTL (session.expiresAt)               │  │
│  │    - Return cached user                                   │  │
│  │ 4. If cache miss OR expired:                              │  │
│  │    - Query DB: SELECT * FROM session WHERE token = ?      │  │
│  │    - Join with user table                                 │  │
│  │    - Cache result (5 min TTL)                             │  │
│  │    - Return user                                          │  │
│  │ 5. Attach to request: req.user = { id, role, ... }        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Session Refresh (Sliding Window):                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ - Session updated every 24 hours                          │  │
│  │ - expiresAt extended by 7 days from last update           │  │
│  │ - Handled automatically by Better Auth                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Session Invalidation (Logout):                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Client calls POST /api/auth/sign-out                   │  │
│  │ 2. Better Auth deletes session from DB                    │  │
│  │ 3. Clear cookie (expires in past)                         │  │
│  │ 4. Remove from LRU cache                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Design

### Connection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 Neon Serverless PostgreSQL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Connection Flow:                                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Application (Drizzle ORM)                                │  │
│  │         │                                                 │  │
│  │         ▼                                                 │  │
│  │  neon() HTTP Client                                       │  │
│  │  (Serverless connection pooling)                          │  │
│  │         │                                                 │  │
│  │         ▼                                                 │  │
│  │  Neon Proxy                                               │  │
│  │  (Connection multiplexing)                                │  │
│  │         │                                                 │  │
│  │         ▼                                                 │  │
│  │  PostgreSQL Database                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Benefits:                                                       │
│  • No connection limit issues                                   │
│  • Automatic scaling                                            │
│  • Cold start optimization                                      │
│  • Branching support                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Query Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                    Database Indexes                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Core Tables:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ departments: idx_departments_code                         │  │
│  │ subjects: idx_subjects_department,                        │  │
│  │           idx_subjects_department_code                    │  │
│  │ teachers: idx_teachers_department,                        │  │
│  │           idx_teachers_email,                             │  │
│  │           idx_teachers_employee_id,                       │  │
│  │           idx_teachers_department_email                   │  │
│  │ classes: idx_classes_subject,                             │  │
│  │          idx_classes_teacher                              │  │
│  │ enrollments: idx_enrollments_student,                     │  │
│  │              idx_enrollments_class,                       │  │
│  │              idx_enrollments_student_class                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Discussion Tables:                                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ discussions: idx_discussions_class,                       │  │
│  │              idx_discussions_author,                      │  │
│  │              idx_discussions_type,                        │  │
│  │              idx_discussions_pinned,                      │  │
│  │              idx_discussions_last_activity                │  │
│  │ discussion_replies: idx_replies_discussion,               │  │
│  │                   idx_replies_author,                     │  │
│  │                   idx_replies_parent,                     │  │
│  │                   idx_replies_accepted                    │  │
│  │ discussion_views: idx_views_user                          │  │
│  │ discussion_votes: idx_votes_user                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Auth Tables:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ session: session_user_id_idx                              │  │
│  │ account: account_user_id_idx                              │  │
│  │ verification: verification_identifier_idx                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Caching Strategy

### Multi-Level Caching

```
┌─────────────────────────────────────────────────────────────────┐
│                    Caching Architecture                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Level 1: LRU Session Cache (In-Memory)                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Type: Map<string, CachedSession>                          │  │
│  │ Max Size: 1000 entries                                    │  │
│  │ TTL: 5 minutes                                            │  │
│  │ Eviction: LRU (delete oldest)                             │  │
│  │ Data: User info + dual expiry (local + provider)          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Level 2: Database Query Results (Not Cached)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Note: Dashboard queries execute on each request           │  │
│  │ Recommendation: Add Redis for frequently accessed data    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Level 3: Neon Connection Pooling                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Type: HTTP connection multiplexing                        │  │
│  │ Managed by: Neon Proxy                                    │  │
│  │ Benefits: No connection limit, auto-scaling               │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: Network Security                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • HTTPS (production)                                      │  │
│  │ • CORS with trusted origins                               │  │
│  │ • Cookie security (HttpOnly, SameSite)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 2: Application Security                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Rate Limiting (Arcjet)                                  │  │
│  │ • Bot Detection                                           │  │
│  │ • SQL Injection Protection (Shield)                       │  │
│  │ • Input Validation (required in routes)                   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 3: Authentication Security                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Session-based auth (Better Auth)                        │  │
│  │ • Secure password hashing                                 │  │
│  │ • Session expiry (7 days)                                 │  │
│  │ • Session invalidation on logout                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 4: Authorization                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Role-based access control (RBAC)                        │  │
│  │ • Permission checks in route handlers                     │  │
│  │ • Teacher-only actions (pin, lock, accept)                │  │
│  │ • Owner-only actions (edit, delete own posts)             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Layer 5: Data Security                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ • Parameterized queries (Drizzle ORM)                     │  │
│  │ • Foreign key constraints                                 │  │
│  │ • Cascade deletes (where appropriate)                     │  │
│  │ • Restrict deletes (for critical data)                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Scalability Analysis                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Strengths:                                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✓ Serverless database (Neon auto-scales)                  │  │
│  │ ✓ Stateless application (can horizontal scale)            │  │
│  │ ✓ Session stored in DB (not in-memory)                    │  │
│  │ ✓ Connection pooling (Neon proxy)                         │  │
│  │ ✓ Rate limiting (prevents abuse)                          │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Bottlenecks:                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✗ In-memory LRU cache (not shared across instances)       │  │
│  │ ✗ No query result caching (Redis)                         │  │
│  │ ✗ Single Express instance (no load balancer)              │  │
│  │ ✗ No CDN for static assets                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Recommendations for Scale:                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Replace LRU cache with Redis                           │  │
│  │ 2. Add Redis for dashboard query caching                  │  │
│  │ 3. Deploy behind load balancer                            │  │
│  │ 4. Use multiple replicas (read scaling)                   │  │
│  │ 5. Add CDN for frontend assets                            │  │
│  │ 6. Implement database connection pooling (PgBouncer)      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Horizontal Scaling Architecture (Future)

```
┌─────────────────────────────────────────────────────────────────┐
│              Horizontal Scaling Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────┐                             │
│                    │  Load        │                             │
│                    │  Balancer    │                             │
│                    │  (nginx)     │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│          ┌────────────────┼────────────────┐                    │
│          │                │                │                    │
│          ▼                ▼                ▼                    │
│    ┌──────────┐    ┌──────────┐    ┌──────────┐                │
│    │ Instance │    │ Instance │    │ Instance │                │
│    │    1     │    │    2     │    │    3     │                │
│    │ (Express)│    │ (Express)│    │ (Express)│                │
│    └────┬─────┘    └────┬─────┘    └────┬─────┘                │
│         │               │               │                       │
│         └───────────────┼───────────────┘                       │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │       Redis          │                          │
│              │  (Session + Cache)   │                          │
│              └──────────┬───────────┘                          │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │  Neon PostgreSQL     │                          │
│              │  (Primary + Replicas)│                          │
│              └──────────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** March 2026  
**Version:** 1.0.0
