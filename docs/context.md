# Smart Campus OS – Agent Context

> This file preserves the context and design decisions made by the AI coding agent.

---

## Project Overview

**Smart Campus OS** is a modular MERN-stack platform for managing campus operations.
It features a cream/light-brown themed UI with 3D glassmorphism effects, mouse-parallax
interactions, and floating orb animations.

## Codebase Architecture

```
Smart Campus/
├── .env / .env.example
├── package.json                    # Root monorepo (npm workspaces)
├── docs/
│   ├── architecture.md
│   ├── changelog.md
│   └── context.md                  # This file
│
├── server/
│   ├── uploads/                    # Static file storage
│   │   ├── notices/
│   │   └── notes/
│   └── src/
│       ├── server.js               # Entry – connect DB, seed, start Express
│       ├── app.js                  # Express setup (middleware, 9 route modules)
│       ├── config/env.js
│       ├── db/mongo.js
│       ├── utils/
│       │   ├── authToken.js        # JWT sign/verify
│       │   ├── geo.js              # Haversine distance
│       │   ├── summariser.js       # Extractive text summarizer
│       │   └── upload.js           # Multer config
│       ├── middleware/
│       │   ├── auth.js             # protect, authorize, dashboardRoleGuard
│       │   ├── errorHandler.js
│       │   └── notFound.js
│       └── modules/
│           ├── auth/               # User model, register/login/refresh/logout
│           ├── campus/             # Campus overview
│           ├── dashboard/          # Role-specific dashboard data
│           ├── health/             # Health check
│           ├── location/           # CampusLocation CRUD (admin GPS mgmt)
│           ├── attendance/         # Sessions + Records (QR + geolocation)
│           ├── notice/             # Notices with file attachments + AI summary
│           ├── complaint/          # Student complaints + status + responses
│           └── utilities/          # Notes, Lost & Found, Discussion
│
└── client/
    └── src/
        ├── App.jsx                 # View-state routing
        ├── styles.css              # Global styles (1800+ lines)
        ├── api/client.js           # Axios with JWT interceptors
        ├── context/AuthContext.jsx
        ├── components/             # Navbar, Hero3D, Modules, etc.
        ├── hooks/
        └── pages/
            ├── auth/               # LoginPage, RegisterPage
            ├── dashboard/          # DashboardPage (sidebar shell), OverviewPanel
            ├── attendance/         # AttendancePage
            ├── notices/            # NoticePage
            ├── complaints/         # ComplaintPage
            ├── utilities/          # UtilitiesPage (tabbed)
            └── locations/          # CampusLocationsPage (admin)
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| **Auth** ||||
| POST | /api/v1/auth/register | No | Create account |
| POST | /api/v1/auth/login | No | Login + tokens |
| GET | /api/v1/auth/me | Yes | Current profile |
| POST | /api/v1/auth/refresh | No | Refresh tokens |
| POST | /api/v1/auth/logout | Yes | Invalidate session |
| **Locations** ||||
| GET | /api/v1/locations | Yes | List campuses |
| POST | /api/v1/locations | Admin | Add campus |
| PUT | /api/v1/locations/:id | Admin | Update campus |
| DELETE | /api/v1/locations/:id | Admin | Remove campus |
| **Attendance** ||||
| POST | /api/v1/attendance/sessions | Teacher/Admin | Create session |
| GET | /api/v1/attendance/sessions | Teacher/Admin | List sessions |
| GET | /api/v1/attendance/sessions/:id/records | Teacher/Admin | Session records |
| PUT | /api/v1/attendance/manual | Teacher/Admin | Manual mark |
| POST | /api/v1/attendance/mark | Student | GPS-verified mark |
| GET | /api/v1/attendance/my | Student | My attendance + % |
| **Notices** ||||
| POST | /api/v1/notices | Teacher/Admin | Create (+ files) |
| GET | /api/v1/notices | Yes | Role-filtered list |
| GET | /api/v1/notices/:id | Yes | Detail + mark read |
| DELETE | /api/v1/notices/:id | Author/Admin | Delete |
| **Complaints** ||||
| POST | /api/v1/complaints | Student | Raise complaint |
| GET | /api/v1/complaints | Yes | Filtered list |
| GET | /api/v1/complaints/:id | Yes | Detail + thread |
| PUT | /api/v1/complaints/:id/status | Teacher/Admin | Update status |
| POST | /api/v1/complaints/:id/responses | Teacher/Admin | Add response |
| **Utilities** ||||
| POST | /api/v1/utilities/notes | Yes | Share note (+ file) |
| GET | /api/v1/utilities/notes | Yes | Browse notes |
| DELETE | /api/v1/utilities/notes/:id | Owner/Admin | Delete note |
| POST | /api/v1/utilities/lostfound | Yes | Post lost/found |
| GET | /api/v1/utilities/lostfound | Yes | Browse items |
| PUT | /api/v1/utilities/lostfound/:id | Yes | Claim item |
| POST | /api/v1/utilities/discussions | Yes | Ask question |
| GET | /api/v1/utilities/discussions | Yes | Browse Q&A |
| POST | /api/v1/utilities/discussions/:id/answers | Yes | Answer |
| PUT | /api/v1/utilities/discussions/:id/solved | Author/Admin | Toggle solved |
| **Other** ||||
| GET | /api/v1/health | No | Health check |
| GET | /api/v1/campus/overview | No | Campus stats |
| GET | /api/v1/dashboard/:role | Yes | Dashboard data |

## Key Design Decisions

- **Geolocation Attendance**: Student browser sends GPS → server checks Haversine distance to ALL active campus locations → must be within configured radius (default 100m)
- **Default Campus**: BBD NIIT Lucknow (26.886316, 81.059048) auto-seeded on first startup
- **AI Summarization**: Pure JS extractive summarizer (no external API) – scores sentences by keyword frequency
- **File Uploads**: Multer with local disk storage in `server/uploads/`, served statically at `/uploads`
- **Dashboard Layout**: Sidebar shell with module switching via React state (no react-router)
- **Refresh Token Rotation**: Each refresh issues new token pair, preventing replay attacks

## Design System

- **Colors**: Cream (#fffdf8), Sand (#b99f6b / #8d774f), Ink (#2a241a)
- **Fonts**: Manrope (sans-serif body), Fraunces (serif headings)
- **Effects**: Glassmorphism, 3D perspective transforms, floating orbs, parallax
- **Module Styles**: `mod-*` prefix for all module page classes (mod-hero, mod-section, mod-stat-card, mod-table, mod-badge, mod-tabs, etc.)
