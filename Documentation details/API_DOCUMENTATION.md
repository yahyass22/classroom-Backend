# 📡 API Documentation

Complete API reference for the Classroom Backend API.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
  - [Authentication](#authentication-endpoints)
  - [Dashboard](#dashboard-endpoints)
  - [Classes](#classes-endpoints)
  - [Subjects](#subjects-endpoints)
  - [Users](#users-endpoints)
  - [Discussions](#discussions-endpoints)

---

## Overview

The Classroom Backend API is a RESTful API built with Express.js and TypeScript. It provides endpoints for managing classes, users, discussions, and dashboard analytics.

**API Version:** 1.0.0  
**Specification:** OpenAPI 3.0 (compatible)

---

## Base URL

```
Development: http://localhost:8000
Production:  https://classroom-front-end-blush.vercel.app/login
```

All endpoints are prefixed with `/api`.

---

## Authentication

Most endpoints require authentication via session cookies.

### Authentication Method

**Cookie-based Session Authentication**

- **Cookie Name:** `better-auth.session_token`
- **Session Expiry:** 7 days
- **Sliding Window:** 24 hours

### Including Authentication

```javascript
// Frontend fetch example
fetch('http://localhost:8000/api/classes', {
  method: 'GET',
  credentials: 'include', // Important: sends cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Authenticated Request Flow

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  Server  │
└────┬─────┘                              └────┬─────┘
     │                                        │
     │  GET /api/classes                      │
     │  Cookie: better-auth.session_token=... │
     │───────────────────────────────────────►│
     │                                        │
     │                                        │  Validate session
     │                                        │  (LRU cache → DB)
     │                                        │
     │                                        │  Attach req.user
     │                                        │
     │  200 OK { data: [...], pagination }    │
     │◄───────────────────────────────────────│
     │                                        │
```

---

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
Cookie: better-auth.session_token=<token>  # For authenticated requests
```

### Response Format

**Success Response:**
```json
{
  "data": { ... }
}
```

**List Response (with pagination):**
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input or missing required fields |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Error Handling

### Error Response Structure

```json
{
  "error": "Short error message",
  "details": "Detailed error description (optional)"
}
```

### Common Errors

| Error | Status | Description |
|-------|--------|-------------|
| `Unauthorized` | 401 | Missing or invalid session |
| `Forbidden` | 403 | Insufficient permissions for action |
| `Invalid discussion or class ID` | 400 | Malformed ID parameter |
| `Title and content are required` | 400 | Missing required fields |
| `Class not found` | 404 | Class ID doesn't exist |
| `Discussion not found` | 404 | Discussion ID doesn't exist |
| `Failed to fetch stats` | 500 | Database query error |

### Error Example

```json
{
  "error": "Failed to fetch stats",
  "details": "relation \"classes\" does not exist"
}
```

---

## Rate Limiting

Rate limiting is enforced by Arcjet middleware based on user role.

### Rate Limits

| User Role | Requests per Minute | Window |
|-----------|--------------------|---------|
| **Admin** | 20 | Sliding window |
| **Teacher** | 10 | Sliding window |
| **Student** | 10 | Sliding window |
| **Guest** (unauthenticated) | 5 | Sliding window |

### Rate Limit Response

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many requests",
  "message": "User request limit exceeded (10 per minute). Please wait."
}
```

### Bot Detection

Automated bot requests are blocked:

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Automated requests are not allowed"
}
```

---

## Endpoints

### Authentication Endpoints

Managed by Better-Auth.

#### Sign Up (Email/Password)

```http
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword123",
  "name": "John Doe",
  "role": "student"  // optional, defaults to "student"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Set-Cookie Header:**
```http
Set-Cookie: better-auth.session_token=abc123...; Path=/; HttpOnly; SameSite=lax
```

---

#### Sign In (Email/Password)

```http
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "student@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student"
  }
}
```

**Set-Cookie Header:**
```http
Set-Cookie: better-auth.session_token=abc123...; Path=/; HttpOnly; SameSite=lax
```

---

#### Sign Out

```http
POST /api/auth/sign-out
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Set-Cookie Header:**
```http
Set-Cookie: better-auth.session_token=; Path=/; Max-Age=0
```

---

#### Get Session

```http
GET /api/auth/session
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "user_abc123",
    "email": "student@example.com",
    "name": "John Doe",
    "role": "student",
    "image": "https://..."
  },
  "session": {
    "id": "session_xyz789",
    "expiresAt": "2026-03-20T12:00:00.000Z"
  }
}
```

**Response (401 Unauthorized):**
```json
null
```

---

### Dashboard Endpoints

Base path: `/api/dashboard`

#### Get Dashboard Statistics

```http
GET /api/dashboard/stats
```

**Authentication:** Optional (works without auth)

**Response (200 OK):**
```json
{
  "totalStudents": 500,
  "totalClasses": 158,
  "totalTeachers": 60,
  "totalSubjects": 75,
  "totalEnrollments": 4848
}
```

---

#### Get Enrollment Trends

```http
GET /api/dashboard/enrollment-trends
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  { "month": "2024-09", "count": 150 },
  { "month": "2024-10", "count": 320 },
  { "month": "2024-11", "count": 480 },
  { "month": "2024-12", "count": 650 },
  { "month": "2025-01", "count": 890 },
  { "month": "2025-02", "count": 1200 },
  { "month": "2025-03", "count": 1580 },
  { "month": "2025-04", "count": 2100 },
  { "month": "2025-05", "count": 2650 },
  { "month": "2025-06", "count": 3200 },
  { "month": "2025-07", "count": 3850 },
  { "month": "2025-08", "count": 4848 }
]
```

---

#### Get Recent Classes

```http
GET /api/dashboard/recent-classes
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "id": 184,
    "name": "Section A",
    "status": "active",
    "capacity": 50,
    "bannerUrl": "https://...",
    "subject": {
      "name": "Introduction to Programming",
      "code": "CS101"
    },
    "teacher": {
      "name": "Dr. Jane Smith",
      "email": "jane.smith@university.edu"
    },
    "enrolledStudents": 45
  },
  {
    "id": 183,
    "name": "Section B",
    "status": "active",
    "capacity": 40,
    "bannerUrl": null,
    "subject": {
      "name": "Data Structures",
      "code": "CS201"
    },
    "teacher": {
      "name": "Prof. John Doe",
      "email": "john.doe@university.edu"
    },
    "enrolledStudents": 38
  }
]
```

---

#### Get Enrollment by Department

```http
GET /api/dashboard/enrollment-by-department
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  { "department": "Computer Science", "month": "2024-09", "count": 45 },
  { "department": "Computer Science", "month": "2024-10", "count": 89 },
  { "department": "Information Technology", "month": "2024-09", "count": 32 },
  { "department": "Information Technology", "month": "2024-10", "count": 67 },
  { "department": "Mathematics", "month": "2024-09", "count": 28 },
  ...
]
```

---

#### Get Student Department Distribution

```http
GET /api/dashboard/student-department-distribution
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "name": "Computer Science",
    "code": "CS",
    "studentCount": 125
  },
  {
    "name": "Information Technology",
    "code": "IT",
    "studentCount": 98
  },
  {
    "name": "Mathematics",
    "code": "MATH",
    "studentCount": 76
  },
  {
    "name": "Physics",
    "code": "PHYS",
    "studentCount": 54
  },
  ...
]
```

---

#### Get Class Status Distribution

```http
GET /api/dashboard/class-status-distribution
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  { "status": "active", "count": 158 },
  { "status": "inactive", "count": 14 },
  { "status": "archived", "count": 12 }
]
```

---

#### Get At-Risk Resources

```http
GET /api/dashboard/at-risk
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "id": 91,
    "name": "Section C",
    "inviteCode": "abc123",
    "type": "class",
    "reason": "Active with 0 enrollments"
  },
  {
    "id": 92,
    "name": "Section D",
    "inviteCode": "def456",
    "type": "class",
    "reason": "Active with 0 enrollments"
  },
  {
    "id": 15,
    "name": "Dr. Smith Johnson",
    "inviteCode": "EMP0015",
    "type": "teacher",
    "reason": "No subjects assigned"
  }
]
```

---

#### Get Schedule Heatmap

```http
GET /api/dashboard/schedule-heatmap
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "classId": 1,
    "className": "Section A",
    "subjectName": "Introduction to Programming",
    "subjectCode": "CS101",
    "departmentCode": "CS",
    "departmentName": "Computer Science",
    "teacherName": "Dr. Jane Smith",
    "teacherImage": "https://...",
    "day": "Monday",
    "startTime": "09:00",
    "endTime": "10:30"
  },
  {
    "classId": 1,
    "className": "Section A",
    "subjectName": "Introduction to Programming",
    "subjectCode": "CS101",
    "departmentCode": "CS",
    "departmentName": "Computer Science",
    "teacherName": "Dr. Jane Smith",
    "teacherImage": "https://...",
    "day": "Wednesday",
    "startTime": "09:00",
    "endTime": "10:30"
  },
  ...
]
```

---

#### Get Top Teachers

```http
GET /api/dashboard/top-teachers
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Dr. Jane Smith",
    "email": "jane.smith@university.edu",
    "department": "Computer Science",
    "classCount": 5,
    "studentCount": 225
  },
  {
    "id": 2,
    "name": "Prof. John Doe",
    "email": "john.doe@university.edu",
    "department": "Computer Science",
    "classCount": 4,
    "studentCount": 180
  },
  ...
]
```

---

#### Get User Signup Trends

```http
GET /api/dashboard/user-signup-trends
```

**Authentication:** Optional

**Response (200 OK):**
```json
[
  {
    "month": "2024-09",
    "students": 45,
    "teachers": 5,
    "total": 50
  },
  {
    "month": "2024-10",
    "students": 78,
    "teachers": 8,
    "total": 86
  },
  ...
]
```

---

### Classes Endpoints

Base path: `/api/classes`

#### Get All Classes

```http
GET /api/classes?search=&subjectId=&teacherId=&page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by class name or invite code |
| `subjectId` | number | - | Filter by subject ID |
| `teacherId` | string | - | Filter by teacher user ID |
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max 100) |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 184,
      "name": "Section A",
      "inviteCode": "abc123",
      "status": "active",
      "capacity": 50,
      "bannerUrl": "https://...",
      "createdAt": "2025-03-01T10:00:00.000Z",
      "subject": {
        "id": 1,
        "name": "Introduction to Programming",
        "code": "CS101"
      },
      "teacher": {
        "id": "user_abc123",
        "name": "Dr. Jane Smith",
        "email": "jane.smith@university.edu",
        "image": "https://..."
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 184,
    "totalPages": 19
  }
}
```

---

#### Get Class by ID

```http
GET /api/classes/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Class ID |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": {
    "id": 184,
    "name": "Section A",
    "inviteCode": "abc123",
    "status": "active",
    "capacity": 50,
    "bannerUrl": "https://...",
    "description": "Learn programming basics with Python",
    "schedules": [
      { "day": "Monday", "startTime": "09:00", "endTime": "10:30" },
      { "day": "Wednesday", "startTime": "09:00", "endTime": "10:30" }
    ],
    "createdAt": "2025-03-01T10:00:00.000Z",
    "subject": {
      "id": 1,
      "name": "Introduction to Programming",
      "code": "CS101"
    },
    "department": {
      "id": 1,
      "name": "Computer Science",
      "code": "CS"
    },
    "teacher": {
      "id": "user_abc123",
      "name": "Dr. Jane Smith",
      "email": "jane.smith@university.edu",
      "image": "https://..."
    }
  }
}
```

**Response (404 Not Found):**
```json
{
  "error": "No Class found."
}
```

---

#### Create Class

```http
POST /api/classes
Content-Type: application/json

{
  "subjectId": 1,
  "teacherId": "user_abc123",
  "name": "Section A",
  "description": "Learn programming basics",
  "capacity": 50,
  "status": "active",
  "schedules": [
    { "day": "Monday", "startTime": "09:00", "endTime": "10:30" },
    { "day": "Wednesday", "startTime": "09:00", "endTime": "10:30" }
  ]
}
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `subjectId` | number | Yes | Subject ID |
| `teacherId` | string | Yes | Teacher user ID |
| `name` | string | Yes | Class name/section |
| `description` | string | No | Class description |
| `capacity` | number | No | Max capacity (default: 50) |
| `status` | string | No | active/inactive/archived |
| `schedules` | array | No | Schedule array |

**Note:** `inviteCode` is auto-generated.

**Authentication:** Required

**Response (201 Created):**
```json
{
  "data": {
    "id": 185
  }
}
```

**Response (500 Internal Server Error):**
```json
{
  "error": "Failed to create class"
}
```

---

### Subjects Endpoints

Base path: `/api/subjects`

#### Get All Subjects

```http
GET /api/subjects?search=&department=&page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by subject name or code |
| `department` | string | - | Filter by department name |
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max 100) |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Introduction to Programming",
      "code": "CS101",
      "description": "Learn programming basics with Python",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "department": {
        "id": 1,
        "name": "Computer Science",
        "code": "CS"
      }
    },
    {
      "id": 2,
      "name": "Data Structures",
      "code": "CS201",
      "description": "Advanced data structures and algorithms",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "department": {
        "id": 1,
        "name": "Computer Science",
        "code": "CS"
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 75,
    "totalPages": 8
  }
}
```

---

### Users Endpoints

Base path: `/api/users`

#### Get All Users

```http
GET /api/users?search=&role=&page=1&limit=10
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `search` | string | - | Search by user name or email |
| `role` | string | - | Filter by role (student/teacher/admin) |
| `page` | number | 1 | Page number (1-indexed) |
| `limit` | number | 10 | Items per page (max 100) |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "user_abc123",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "emailVerified": true,
      "image": "https://...",
      "role": "student",
      "imageCldPubId": null,
      "createdAt": "2025-03-01T10:00:00.000Z",
      "updatedAt": "2025-03-01T10:00:00.000Z"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 563,
    "totalPages": 57
  }
}
```

---

### Discussions Endpoints

Base paths:
- Global: `/api/discussions`
- Class-specific: `/api/classes/:classId/discussions`

#### Get All Discussions (Global)

```http
GET /api/discussions?type=&sortBy=lastActivityAt&page=1&limit=50
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | all | Filter by type (general/question/announcement/resource) |
| `sortBy` | string | lastActivityAt | Sort: latest/mostActive/mostViewed/unanswered |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "classId": 184,
      "authorId": "user_abc123",
      "title": "Help with Assignment 3",
      "content": "Can someone explain question 2?",
      "type": "question",
      "isPinned": false,
      "isLocked": false,
      "viewCount": 45,
      "replyCount": 8,
      "lastActivityAt": "2025-03-10T14:30:00.000Z",
      "createdAt": "2025-03-08T10:00:00.000Z",
      "updatedAt": "2025-03-10T14:30:00.000Z",
      "author": {
        "id": "user_abc123",
        "name": "John Doe",
        "role": "student",
        "image": "https://..."
      },
      "class": {
        "id": 184,
        "name": "Section A"
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

---

#### Get Discussion by ID (Global)

```http
GET /api/discussions/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Discussion ID |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "classId": 184,
    "authorId": "user_abc123",
    "title": "Help with Assignment 3",
    "content": "Can someone explain question 2?",
    "type": "question",
    "isPinned": false,
    "isLocked": false,
    "viewCount": 46,
    "replyCount": 8,
    "lastActivityAt": "2025-03-10T14:30:00.000Z",
    "createdAt": "2025-03-08T10:00:00.000Z",
    "updatedAt": "2025-03-10T14:30:00.000Z",
    "author": {
      "id": "user_abc123",
      "name": "John Doe",
      "role": "student",
      "image": "https://..."
    },
    "class": {
      "id": 184,
      "name": "Section A"
    },
    "replies": [
      {
        "id": 1,
        "discussionId": 1,
        "parentId": null,
        "authorId": "user_def456",
        "content": "Sure! Question 2 is about...",
        "upvotes": 5,
        "downvotes": 0,
        "isAccepted": true,
        "createdAt": "2025-03-08T11:00:00.000Z",
        "updatedAt": "2025-03-08T11:00:00.000Z",
        "author": {
          "id": "user_def456",
          "name": "Jane Smith",
          "role": "teacher",
          "image": "https://..."
        },
        "voteCount": 5
      },
      ...
    ]
  }
}
```

**Note:** This endpoint increments the view count for unique users.

---

#### Get Class Discussions

```http
GET /api/classes/:classId/discussions?type=&sortBy=lastActivityAt&page=1&limit=20
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `type` | string | all | Filter by discussion type |
| `sortBy` | string | lastActivityAt | Sort option |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "classId": 184,
      "authorId": "user_abc123",
      "title": "Help with Assignment 3",
      "content": "Can someone explain question 2?",
      "type": "question",
      "isPinned": false,
      "isLocked": false,
      "viewCount": 45,
      "replyCount": 8,
      "lastActivityAt": "2025-03-10T14:30:00.000Z",
      "createdAt": "2025-03-08T10:00:00.000Z",
      "updatedAt": "2025-03-10T14:30:00.000Z",
      "author": {
        "id": "user_abc123",
        "name": "John Doe",
        "role": "student",
        "image": "https://..."
      }
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

---

#### Create Discussion

```http
POST /api/classes/:classId/discussions
Content-Type: application/json

{
  "title": "Question about Assignment",
  "content": "Can someone help me understand...",
  "type": "question"
}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Discussion title (max 500 chars) |
| `content` | string | Yes | Discussion content (markdown) |
| `type` | string | No | general/question/announcement/resource |

**Authentication:** Required

**Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "classId": 184,
    "authorId": "user_abc123",
    "title": "Question about Assignment",
    "content": "Can someone help me understand...",
    "type": "question",
    "isPinned": false,
    "isLocked": false,
    "viewCount": 0,
    "replyCount": 0,
    "lastActivityAt": "2025-03-10T15:00:00.000Z",
    "createdAt": "2025-03-10T15:00:00.000Z",
    "updatedAt": "2025-03-10T15:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Title and content are required"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized. Please log in to create discussions."
}
```

**Response (404 Not Found):**
```json
{
  "error": "Class not found"
}
```

---

#### Update Discussion

```http
PUT /api/classes/:classId/discussions/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content...",
  "type": "general"
}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |
| `id` | number | Discussion ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Updated title |
| `content` | string | No | Updated content |
| `type` | string | No | Updated type |

**Authentication:** Required (author only)

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "title": "Updated Title",
    "content": "Updated content...",
    "type": "general",
    ...
  }
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Discussion not found in this class"
}
```

---

#### Delete Discussion

```http
DELETE /api/classes/:classId/discussions/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |
| `id` | number | Discussion ID |

**Authentication:** Required (author, teacher, or admin)

**Response (200 OK):**
```json
{
  "message": "Discussion deleted successfully"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Discussion not found in this class"
}
```

---

#### Pin Discussion (Teacher Only)

```http
POST /api/classes/:classId/discussions/:id/pin
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |
| `id` | number | Discussion ID |

**Authentication:** Required (teacher or admin only)

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "isPinned": true,
    ...
  }
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden - teachers only"
}
```

---

#### Lock Discussion (Teacher Only)

```http
POST /api/classes/:classId/discussions/:id/lock
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `classId` | number | Class ID |
| `id` | number | Discussion ID |

**Authentication:** Required (teacher or admin only)

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "isLocked": true,
    ...
  }
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden - teachers only"
}
```

---

#### Get Replies

```http
GET /api/discussions/:discussionId/replies
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `discussionId` | number | Discussion ID |

**Authentication:** Optional

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "discussionId": 1,
      "parentId": null,
      "authorId": "user_def456",
      "content": "Sure! Question 2 is about...",
      "upvotes": 5,
      "downvotes": 0,
      "isAccepted": true,
      "createdAt": "2025-03-08T11:00:00.000Z",
      "updatedAt": "2025-03-08T11:00:00.000Z",
      "author": {
        "id": "user_def456",
        "name": "Jane Smith",
        "role": "teacher",
        "image": "https://..."
      }
    },
    ...
  ]
}
```

---

#### Create Reply

```http
POST /api/discussions/:discussionId/replies
Content-Type: application/json

{
  "content": "Here's my answer...",
  "parentId": null  // optional, for nested replies
}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `discussionId` | number | Discussion ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | Reply content (markdown) |
| `parentId` | number | No | Parent reply ID (for nested replies) |

**Authentication:** Required

**Response (201 Created):**
```json
{
  "data": {
    "id": 2,
    "discussionId": 1,
    "parentId": null,
    "authorId": "user_ghi789",
    "content": "Here's my answer...",
    "upvotes": 0,
    "downvotes": 0,
    "isAccepted": false,
    "createdAt": "2025-03-10T16:00:00.000Z",
    "updatedAt": "2025-03-10T16:00:00.000Z"
  }
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Content is required"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Discussion is locked"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Discussion not found"
}
```

---

#### Vote on Reply

```http
POST /api/discussions/:discussionId/replies/:replyId/vote
Content-Type: application/json

{
  "voteType": "up"  // or "down"
}
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `discussionId` | number | Discussion ID |
| `replyId` | number | Reply ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `voteType` | string | Yes | "up" or "down" |

**Authentication:** Required

**Response (200 OK):**
```json
{
  "data": {
    "replyId": 1,
    "userId": "user_abc123",
    "voteType": "up",
    "createdAt": "2025-03-10T17:00:00.000Z"
  }
}
```

**Note:** Voting is toggle-based. Sending the same vote again removes it.

---

#### Accept Answer (Teacher Only)

```http
POST /api/discussions/:discussionId/replies/:replyId/accept
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `discussionId` | number | Discussion ID |
| `replyId` | number | Reply ID |

**Authentication:** Required (teacher or admin only)

**Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "isAccepted": true,
    ...
  }
}
```

**Response (403 Forbidden):**
```json
{
  "error": "Forbidden - teachers only"
}
```

---

## Debug Endpoints (Development Only)

Available only when `NODE_ENV=development`.

#### Debug Session

```http
GET /api/debug-session
```

**Response (200 OK):**
```json
{
  "hasCookie": true,
  "cookieLength": 64,
  "hasUser": true,
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "role": "student"
  }
}
```

---

#### Debug Auth

```http
GET /api/debug-auth
```

**Response (200 OK):**
```json
{
  "hasCookie": true,
  "cookieLength": 64,
  "hasUser": true,
  "user": {
    "id": "user_abc123",
    "name": "John Doe",
    "role": "student"
  }
}
```

---

## Health Check

```http
GET /
```

**Response (200 OK):**
```
Welcome to the Classroom API!
```

---

## Rate Limit Headers

Arcjet doesn't expose rate limit headers by default, but responses include:

- **429 Too Many Requests:** When rate limit exceeded
- **403 Forbidden:** When bot detected or shield triggered

---

## CORS Configuration

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Expose-Headers: Set-Cookie
```

---

**Last Updated:** March 2026  
**API Version:** 1.0.0
