# Smart Campus OS - Architecture

## Backend

- `config/`: environment and app config (JWT secrets, MongoDB URI, token expiry)
- `db/`: MongoDB connection and DB utility code
- `utils/`: JWT token signing/verification helpers (access + refresh tokens)
- `modules/`: domain-based feature modules
  - `auth/` – User model, register/login/refresh/logout controllers, express-validator rules
  - `campus/` – Campus snapshot model and overview endpoint
  - `dashboard/` – Role-specific dashboard data generators (student/teacher/admin)
  - `health/` – Health check endpoint
- `middleware/`: shared request/response middleware
  - `auth.js` – JWT protect, role-based authorize, dashboard role guard
  - `errorHandler.js` – Global error handler
  - `notFound.js` – 404 catch-all

## Frontend

- `api/`: Axios client with JWT auto-attach and transparent refresh
- `context/`: AuthContext provider (register, login, logout, fetchMe)
- `components/`: reusable UI sections (Navbar, Hero3D, Modules, ImpactStats, FooterCTA)
- `hooks/`: interaction and behavior hooks (useMouseParallax)
- `pages/`: route-based page components
  - `auth/` – LoginPage, RegisterPage (glassmorphic design)
  - `dashboard/` – DashboardPage (role-specific content)
- The landing page is intentionally componentized for future portal integrations.
