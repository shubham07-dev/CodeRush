# Smart Campus OS – Agent Context

> This file preserves the context and design decisions made by the AI coding agent
> during the JWT Auth & RBAC implementation session (2026-04-12).

---

## Project Overview

**Smart Campus OS** is a modular MERN-stack platform for managing campus operations.
It features a cream/light-brown themed UI with 3D glassmorphism effects, mouse-parallax
interactions, and floating orb animations.

## Codebase Architecture

```
Smart Campus/
├── .env                        # Environment variables (JWT secrets, MongoDB URI)
├── .env.example                # Template for .env
├── package.json                # Root monorepo (npm workspaces)
├── docs/
│   ├── architecture.md         # System architecture notes
│   ├── changelog.md            # Detailed change log
│   └── context.md              # This file – AI agent context
│
├── server/                     # Express.js backend
│   └── src/
│       ├── server.js           # Entry – connects MongoDB, starts Express
│       ├── app.js              # Express app setup (middleware, routes)
│       ├── config/
│       │   └── env.js          # Centralised environment config
│       ├── db/
│       │   └── mongo.js        # Mongoose connection helper
│       ├── utils/
│       │   └── authToken.js    # JWT sign/verify for access + refresh tokens
│       ├── middleware/
│       │   ├── auth.js         # protect (JWT verify), authorize (RBAC), dashboard guard
│       │   ├── errorHandler.js # Global error handler
│       │   └── notFound.js     # 404 catch-all
│       └── modules/
│           ├── auth/
│           │   ├── auth.constants.js   # USER_ROLES enum
│           │   ├── auth.model.js       # Mongoose User schema
│           │   ├── auth.controller.js  # register, login, me, refresh, logout
│           │   ├── auth.routes.js      # Route definitions with validation
│           │   └── auth.validation.js  # express-validator chains
│           ├── campus/
│           │   ├── campus.model.js
│           │   ├── campus.controller.js
│           │   └── campus.routes.js
│           ├── dashboard/
│           │   ├── dashboard.controller.js  # Role-specific mock data generators
│           │   └── dashboard.routes.js
│           └── health/
│               ├── health.controller.js
│               └── health.routes.js
│
└── client/                     # React + Vite frontend
    ├── index.html              # HTML shell (fonts: Manrope, Fraunces)
    ├── vite.config.js          # Vite config (port 5173)
    └── src/
        ├── main.jsx            # React root mount
        ├── App.jsx             # View-state routing (landing/login/register/dashboard)
        ├── styles.css          # Global styles (cream/brown theme, auth, dashboard)
        ├── api/
        │   └── client.js       # Axios instance with JWT interceptors
        ├── context/
        │   └── AuthContext.jsx # Auth state provider
        ├── components/
        │   ├── Navbar.jsx      # Top navigation with Sign In / Get Started buttons
        │   ├── Hero3D.jsx      # 3D parallax hero with floating cards
        │   ├── Modules.jsx     # Feature module cards
        │   ├── ImpactStats.jsx # Campus KPI stat cards
        │   └── FooterCTA.jsx   # Bottom call-to-action
        ├── hooks/
        │   └── useMouseParallax.js  # Mouse-tracking parallax effect
        └── pages/
            ├── auth/
            │   ├── LoginPage.jsx    # Login form (glass card, SVG icons)
            │   └── RegisterPage.jsx # Register form (role selector grid)
            └── dashboard/
                └── DashboardPage.jsx # Post-login role-specific dashboard
```

## Authentication Flow

```
Client                              Server
  │                                   │
  ├── POST /auth/register ──────────► │ validate → create user → hash password
  │◄──────────── { user, token, refreshToken } ── │
  │                                   │
  ├── POST /auth/login ─────────────► │ validate → verify password
  │◄──────────── { user, token, refreshToken } ── │
  │                                   │
  ├── GET /auth/me ─────────────────► │ protect middleware → return user
  │  (Authorization: Bearer <token>)  │
  │                                   │
  ├── POST /auth/refresh ───────────► │ verify refresh token → rotate tokens
  │◄──────────── { token, refreshToken } ─────── │
  │                                   │
  ├── POST /auth/logout ────────────► │ protect → nullify refresh token
  │                                   │
```

## Role-Based Access Control

| Role      | Dashboard Access | Admin Routes | Teacher Routes | Student Routes |
|-----------|:----------------:|:------------:|:--------------:|:--------------:|
| `student` | Student          | ✗            | ✗              | ✓              |
| `teacher` | Teacher          | ✗            | ✓              | ✗              |
| `admin`   | Admin            | ✓            | ✓              | ✓              |

### Middleware Stack

1. `protect` – Verifies JWT, attaches `req.user`
2. `authorize('role1', 'role2')` – Checks `req.user.role` against allowed roles (403 if denied)
3. `authorizeDashboardRoleParam` – Ensures `:role` URL param matches authenticated user's role

## API Endpoints

| Method | Endpoint               | Auth Required | Description                     |
|--------|------------------------|:-------------:|---------------------------------|
| POST   | /api/v1/auth/register  | No            | Create new user account         |
| POST   | /api/v1/auth/login     | No            | Authenticate and get tokens     |
| GET    | /api/v1/auth/me        | Yes           | Get current user profile        |
| POST   | /api/v1/auth/refresh   | No            | Refresh access token            |
| POST   | /api/v1/auth/logout    | Yes           | Invalidate refresh token        |
| GET    | /api/v1/dashboard/:role| Yes           | Get role-specific dashboard data|
| GET    | /api/v1/health         | No            | API health check                |
| GET    | /api/v1/campus/overview | No           | Campus overview stats           |

## Design System

- **Colors**: Cream (#fffdf8), Sand (#b99f6b / #8d774f), Ink (#2a241a)
- **Fonts**: Manrope (sans-serif body), Fraunces (serif headings)
- **Effects**: Glassmorphism, 3D perspective transforms, floating orbs, parallax
- **Animations**: float (orbs), authSlideIn (cards), shake (errors), spin (loaders)

## Security Notes

- Passwords hashed with bcrypt (12 salt rounds)
- Password never returned in API responses (`select: false`)
- Refresh token rotation on each use (prevents replay attacks)
- Access token expiry: 1 day, Refresh token expiry: 7 days
- JWT secrets sourced from environment variables
- Express-validator sanitizes and validates all input
