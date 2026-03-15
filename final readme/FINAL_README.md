# 🎓 Classroom Management System - Final Documentation

Welcome to the definitive guide for the **Classroom Backend API**. This project is a production-grade infrastructure designed to manage academic environments with high efficiency, security, and data-driven insights.

## 📋 Table of Contents
- [✨ Core Features](#-core-features)
- [🏗️ System Architecture](#️-system-architecture)
- [🗄️ Database Design](#️-database-design)
- [📡 API Ecosystem](#-api-overview)
- [🔐 Security & Authentication](#-security--authentication)
- [🚀 Deployment Strategy](#-deployment)
- [🌱 Getting Started](#-quick-start)

---

## ✨ Core Features

### 🏫 Academic Infrastructure
- **Full Hierarchy:** Seamless management of Departments, Subjects, and Class Sections.
- **Smart Enrollment:** Automated invite code generation and student-class tracking.
- **Dynamic Schedules:** Support for complex weekly routines stored in optimized JSONB formats.

### 💬 Discussion Ecosystem
- **Social Engagement:** Threaded replies, upvote/downvote systems, and unique view tracking.
- **Moderation Tools:** Teacher-specific controls including pinning, locking, and "Accepted Answer" marks.
- **Markdown Ready:** Full support for rich text and code snippets in forum posts.

### 📊 Advanced Analytics
- **KPI Tracking:** Real-time stats for student counts, enrollment trends, and class distributions.
- **Risk Assessment:** Automatic detection of orphaned classes or unassigned faculty.
- **Heatmaps:** Visual density charts for campus-wide scheduling.

---

## 🏗️ System Architecture

Our architecture is built on a **Middleware-First** philosophy, ensuring every request is sanitized, authenticated, and rate-limited before reaching the business logic.

![System Component Architecture](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/system%20component%20architecture.png)

### The Stack:
- **Language:** TypeScript 5.9 (Strict Mode)
- **Framework:** Express.js 5.x
- **ORM:** Drizzle ORM (Type-safe queries)
- **Security:** Arcjet (WAF, Bot Detection, Rate Limiting)
- **Auth:** Better-Auth (Session-based)

---

## 🗄️ Database Design

The schema is architected into three logical domains to ensure data integrity and query performance.

![Entity Relationship Diagram](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/db%20schema%202.png)

1.  **Auth Domain:** Handles user identity, OAuth accounts, and secure sessions.
2.  **App Domain:** The academic core managing the relationship between teachers, students, and classes.
3.  **Discussion Domain:** A high-performance forum schema supporting nested relations and social metrics.

---

## 📡 API Overview

The API follows RESTful principles with standardized JSON responses and integrated pagination.

| Base Path | Description |
| :--- | :--- |
| `/api/auth` | Multi-role registration, login, and session management. |
| `/api/dashboard` | 10+ endpoints for deep analytics and trend visualization. |
| `/api/classes` | Class CRUD, scheduling, and enrollment logic. |
| `/api/discussions` | Global forum access and class-specific threads. |

*Full endpoint details can be found in the [API Documentation](./API_DOCUMENTATION.md).*

---

## 🔐 Security & Authentication

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

## 🚀 Deployment

The system is optimized for serverless and edge deployment.

![Deployment Architecture](https://github.com/yahyass22/classroom-Backend/blob/9debbbe41d859af559841420601ea8259f14e131/final%20readme/deploy.png)

- **Database:** Neon PostgreSQL (Serverless with connection pooling).
- **Hosting:** Optimized for Vercel, Railway, or Render.
- **Security:** Arcjet LIVE mode enforced in production.

---

## 🌱 Quick Start

### 1. Installation
```bash
npm install
cp .env.example .env
```

### 2. Migration
```bash
npm run db:generate
npm run db:migrate
```

### 3. Seeding (Mega Data)
To populate the system with 500+ students and 180+ classes for testing:
```bash
npm run db:seed:mega
```

---

## 📚 Documentation Index
- [📡 Full API Reference](./API_DOCUMENTATION.md)
- [🗄️ Database Schema Details](./DATABASE_SCHEMA.md)
- [🚀 Deployment Guide](./DEPLOYMENT.md)
- [🏗️ System Design Deep-Dive](./SYSTEM_DESIGN.md)

---
**Built with ❤️ for the future of Classroom Management.**
