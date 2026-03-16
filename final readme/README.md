# 🎓 Classroom Backend API

A comprehensive, production-ready backend API for classroom management, built with modern TypeScript, Express.js, and PostgreSQL.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle-0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)](https://neon.tech/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-1.4-FF6B6B?logo=auth0&logoColor=white)](https://www.better-auth.com/)
[![Arcjet](https://img.shields.io/badge/Arcjet-Security-7C3AED?logo=security&logoColor=white)](https://arcjet.com/)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#-database-schema)
- [Authentication](#-authentication)
- [Security](#-security)
- [Environment Variables](#-environment-variables)
- [Database Seeding](#-database-seeding)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Documentation](#-documentation)

## ✨ Features

### Core Functionality
- 🏫 **Class Management** - Create, manage, and organize class sections
- 👥 **User Roles** - Multi-role system (Student, Teacher, Admin)
- 📚 **Subject & Department Management** - Hierarchical academic structure
- 📝 **Enrollment System** - Student enrollment tracking with timestamps
- 💬 **Discussion Forums** - Full-featured discussion system with voting, replies, and threading
- 📊 **Dashboard Analytics** - 10+ analytics endpoints for data visualization
- 🔐 **Authentication** - Session-based auth with email/password
- 🔒 **Authorization** - Role-based access control (RBAC)

### Discussion Forum
- 🧵 Nested replies (2 levels)
- 👍 Upvote/downvote system
- 📌 Pin/lock discussions (teachers)
- ✅ Accept answers (teachers)
- 👁️ Unique view tracking
- 🏷️ Discussion types (General, Question, Announcement, Resource)

### Dashboard Analytics
- 📈 Enrollment trends (monthly)
- 📊 Class status distribution
- 🌡️ Department enrollment heatmap
- 📅 Schedule density visualization
- ⚠️ At-risk resource detection
- 👨‍🏫 Top teachers ranking
- 📉 User signup trends

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 20+ (ESM) |
| **Language** | TypeScript 5.9+ (Strict Mode) |
| **Framework** | Express.js 5.x |
| **Database** | PostgreSQL (Neon Serverless) |
| **ORM** | Drizzle ORM 0.45.x |
| **Auth** | Better-Auth 1.4.x |
| **Security** | Arcjet (Rate Limiting, Bot Detection, SQL Injection Protection) |
| **APM** | Apminsight |
| **Migration** | Drizzle Kit |

## 🏗️ System Architecture

Our architecture is built on a **Middleware-First** philosophy, ensuring every request is sanitized, authenticated, and rate-limited before reaching the business logic.

![System Component Architecture](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/system%20component%20architecture.png)

*Full Architecture details can be found in the [System Design Documentation](./SYSTEM_DESIGN.md).*
## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd classroom-backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
# DATABASE_URL=postgresql://...
# BETTER_AUTH_SECRET=your-secret-key
# BETTER_AUTH_URL=http://localhost:8000
# FRONTEND_URL=http://localhost:5173
# ARCJET_KEY=your-arcjet-key

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed the database (choose one)
npm run db:seed          # Basic seed
npm run db:seed:full     # Full seed (recommended)
npm run db:seed:mega     # Mega seed (500+ students)

# Start development server
npm run dev
```

Server will start on `http://localhost:8000`

## 📡 API Endpoints

The Classroom Backend API is a RESTful API built with Express.js and TypeScript. It provides endpoints for managing classes, users, discussions, and dashboard analytics.
![CLASSROOM API endpoint map](https://github.com/yahyass22/classroom-Backend/blob/a69f35a548ed314224056ba13a057106e526693b/final%20readme/Diagrams%20PNG/CLASSROOM%20API%20endpoint%20map.png)

### Authentication
```
POST   /api/auth/sign-up/email        # Register new user
POST   /api/auth/sign-in/email        # Login
POST   /api/auth/sign-out             # Logout
GET    /api/auth/session              # Get current session
```

### Dashboard Analytics
```
GET    /api/dashboard/stats                      # Overall statistics
GET    /api/dashboard/enrollment-trends          # Monthly enrollment trends
GET    /api/dashboard/recent-classes             # Latest 10 classes
GET    /api/dashboard/enrollment-by-department   # Department-wise enrollment
GET    /api/dashboard/student-department-distribution  # Student distribution
GET    /api/dashboard/class-status-distribution  # Class status pie chart
GET    /api/dashboard/at-risk                    # At-risk resources
GET    /api/dashboard/schedule-heatmap           # Class schedules
GET    /api/dashboard/top-teachers               # Top 10 teachers
GET    /api/dashboard/user-signup-trends         # User signup trends
```

### Classes
```
GET    /api/classes              # List classes (paginated, searchable)
GET    /api/classes/:id          # Get class details
POST   /api/classes              # Create new class
```

### Subjects
```
GET    /api/subjects             # List subjects (paginated, searchable)
```

### Users
```
GET    /api/users                # List users (paginated, searchable)
```

### Discussions
```
GET    /api/discussions                          # Global discussions list
GET    /api/discussions/:id                      # Single discussion with replies
POST   /api/classes/:classId/discussions         # Create discussion
PUT    /api/classes/:classId/discussions/:id     # Update discussion
DELETE /api/classes/:classId/discussions/:id     # Delete discussion
POST   /api/classes/:classId/discussions/:id/pin # Toggle pin (teacher)
POST   /api/classes/:classId/discussions/:id/lock# Toggle lock (teacher)
GET    /api/discussions/:discussionId/replies    # Get replies
POST   /api/discussions/:discussionId/replies    # Create reply
POST   /api/discussions/:discussionId/replies/:id/vote    # Vote on reply
POST   /api/discussions/:discussionId/replies/:id/accept  # Accept answer (teacher)
```

For complete API documentation, see [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)

## 🗄️ Database Schema

The schema is architected into three logical domains to ensure data integrity and query performance.

### Core Entities

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   departments   │       │    subjects     │       │    teachers     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │───┐   │ id (PK)         │
│ code            │   │   │ department_id   │◄──┘   │ department_id   │
│ name            │   └──►│ code            │   └──►│ employee_id     │
│ description     │       │ name            │       │ first_name      │
└─────────────────┘       │ description     │       │ last_name       │
                          └─────────────────┘       │ email           │
                                  │                 └─────────────────┘
                                  │
                          ┌─────────────────┐
                          │  teacher_subjects│
                          ├─────────────────┤
                          │ teacher_id (PK) │
                          │ subject_id (PK) │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     classes     │       │   enrollments   │       │      user       │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ student_id (PK) │───┐   │ id (PK)         │
│ subject_id      │◄──┘   │ class_id (PK)   │◄──┘   │ name            │
│ teacher_id      │───┐   │ created_at      │       │ email           │
│ invite_code     │   │   │ updated_at      │       │ role            │
│ name            │   │   └─────────────────┘       │ image           │
│ capacity        │   │                             └─────────────────┘
│ status          │   │
│ schedules (JSON)│   │
└─────────────────┘   │
                      │
┌─────────────────┐   │
│   discussions   │◄──┘
├─────────────────┤
│ id (PK)         │
│ class_id        │
│ author_id       │
│ title           │
│ content         │
│ type            │
│ is_pinned       │
│ is_locked       │
└─────────────────┘
```


![Entity Relationship Diagram](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/db%20schema%202.png)

1.  **Auth Domain:** Handles user identity, OAuth accounts, and secure sessions.
2.  **App Domain:** The academic core managing the relationship between teachers, students, and classes.
3.  **Discussion Domain:** A high-performance forum schema supporting nested relations and social metrics.

For complete ERD diagram, see [DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md)

## 🔐 Authentication

### Session-Based Authentication

The system uses **Better-Auth** for session management:

- **Cookie Name**: `better-auth.session_token`
- **Session Expiry**: 7 days
- **Session Update**: 24 hours (sliding window)
- **Password Hashing**: Built-in (secure)
- **Email Verification**: Optional (disabled by default)

### Role-Based Access Control (RBAC)
- **Students:** Engage in classes and discussions.
- **Teachers:** Manage class content and moderate forums.
- **Admins:** Full system oversight.

### Authentication Flow
The system uses a highly secure **Cookie-based Session** strategy.

![Authentication Flow](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/session%20authentication%20flow.png)

- **CORS Protection:** Requests are validated against a whitelist of trusted origins.
- **Rate Limiting:** Sliding window limits based on user role (Admin: 20/min, User: 10/min).
- **Session Caching:** LRU cache (1000 entries) reduces DB load for session validation.

---
## 🔒 Security

### Arcjet Security Layers

1. **Rate Limiting** (Sliding Window)
   - Admin: 20 requests/minute
   - Teacher/Student: 10 requests/minute
   - Guest: 5 requests/minute

2. **Bot Detection**
   - Blocks automated requests
   - Allows: Search engines, Preview bots (Slack, Discord)

3. **SQL Injection Protection** (Shield)
   - Analyzes request patterns
   - Blocks malicious payloads

### Security Headers

- `HttpOnly` cookies (prevent XSS)
- `SameSite: lax` (prevent CSRF)
- `Secure` flag in production
- CORS with credentials support

## 📝 Environment Variables

```bash
# Required
DATABASE_URL=postgresql://user:password@host/database
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
ARCJET_KEY=aj_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional
NODE_ENV=development
PORT=8000
DEBUG_AUTH=true
ARCJET_ENV=development
```

## 🌱 Database Seeding

### Available Seed Scripts

| Script | Command | Data Volume | Use Case |
|--------|---------|-------------|----------|
| **Basic** | `npm run db:seed` | 5 depts, 9 subjects, ~100 enrollments | Quick testing |
| **Full** | `npm run db:seed:full` | 12 depts, 36 subjects, 600+ enrollments | Dashboard testing |
| **Mega** | `npm run db:seed:mega` | 15 depts, 75 subjects, 4,848 enrollments | Production demo |
| **Discussions** | `npm run db:seed:discussions` | Forum data | Discussion testing |

### Mega Seed Statistics

```
📊 Summary:
   - Users: 563 (500 students, 60 teachers, 3 admins)
   - Departments: 15
   - Subjects: 75
   - Classes: 184 (158 active, 14 inactive, 12 archived)
   - Enrollments: 4,848
   - Teacher-Subject Links: 153

📈 Enrollment Distribution:
   - Academic Year: Sep 2024 - Aug 2025
   - Spread across 12 months
   - Varied saturation levels (25-100%)
```

## 📁 Project Structure

```
classroom-backend/
├── src/
│   ├── config/
│   │   └── arcjet.ts              # Arcjet security configuration
│   ├── db/
│   │   ├── schema/
│   │   │   ├── app.ts             # Core tables (departments, subjects, classes)
│   │   │   ├── auth.ts            # Auth tables (user, session, account)
│   │   │   ├── discussions.ts     # Discussion tables
│   │   │   └── index.ts           # Schema exports
│   │   └── index.ts               # Database connection (Neon)
│   ├── lib/
│   │   └── auth.ts                # Better-auth configuration
│   ├── middleware/
│   │   ├── auth.ts                # Session auth with LRU cache
│   │   └── security.ts            # Arcjet rate limiting
│   ├── routes/
│   │   ├── dashboard.ts           # Dashboard analytics (10 endpoints)
│   │   ├── classes.ts             # Class CRUD (3 endpoints)
│   │   ├── subjects.ts            # Subjects listing
│   │   ├── users.ts               # Users listing
│   │   └── discussions.ts         # Discussion forum (20+ endpoints)
│   ├── index.ts                   # Express app entry point
│   ├── type.d.ts                  # Type declarations
│   └── seed*.ts                   # Database seeding scripts
├── drizzle/
│   ├── 0000_*.sql                 # Core schema migration
│   └── 0001_*.sql                 # Discussions migration
├── docs/
│   ├── SYSTEM_DESIGN.md           # System architecture
│   ├── DATABASE_SCHEMA.md         # Database ERD
│   ├── API_DOCUMENTATION.md       # Complete API docs
│   └── DEPLOYMENT.md              # Deployment guide
├── drizzle.config.ts              # Drizzle Kit config
├── package.json
├── tsconfig.json
└── README.md
```

## 🧑‍💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (tsx watch)
npm run build            # Compile TypeScript
npm run start            # Start production server

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:seed          # Basic seed
npm run db:seed:full     # Full seed
npm run db:seed:mega     # Mega seed
npm run db:seed:discussions  # Seed discussions

# Utilities
npm run crud             # Run CRUD demo
npm run check-sessions   # Check active sessions
```

### TypeScript Configuration

- **Strict Mode**: Enabled
- **Module**: NodeNext (ESM)
- **Target**: ES2022
- **Unchecked Index Access**: Enabled
- **Exact Optional Properties**: Enabled

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Set `ARCJET_ENV=LIVE` (enforce rate limiting)
- [ ] Use strong `BETTER_AUTH_SECRET` (32+ chars)
- [ ] Set `secure: true` for cookies
- [ ] Configure production database URL
- [ ] Set correct `BETTER_AUTH_URL` and `FRONTEND_URL`
- [ ] Run `npm run build` before starting

### Environment-Specific Configs

```bash
# Development
NODE_ENV=development
ARCJET_ENV=development  # DRY_RUN mode
PORT=8000

# Production
NODE_ENV=production
ARCJET_ENV=LIVE         # LIVE mode
PORT=<assigned by platform>
```

### Recommended Platforms

- **Vercel**: Serverless functions
- **Railway**: Full Node.js app
- **Render**: Web services
- **Fly.io**: Global deployment
- **Neon**: Database (already configured)

For detailed deployment guide, see [DEPLOYMENT.md](./docs/DEPLOYMENT.md)

## 📚 Documentation

- [System Design](./docs/SYSTEM_DESIGN.md) - Architecture diagrams and flow
- [Database Schema](./docs/DATABASE_SCHEMA.md) - Complete ERD and table descriptions
- [API Documentation](./docs/API_DOCUMENTATION.md) - All endpoints with examples
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment instructions


## 🤝 Contributing

See [CONTRIBUTING.md](./.github/CONTRIBUTING.md) for contribution guidelines.

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [Better Auth](https://www.better-auth.com/) - Authentication framework
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe ORM
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Arcjet](https://arcjet.com/) - Security and rate limiting
- [Express.js](https://expressjs.com/) - Web framework

---

**Built with ❤️ using TypeScript, Express, and PostgreSQL**
