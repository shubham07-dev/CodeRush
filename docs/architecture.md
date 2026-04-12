# Smart Campus OS - Architecture

## Backend

- `config/`: environment and app config (JWT secrets, MongoDB URI, token expiry)
- `db/`: MongoDB connection and DB utility code
- `utils/`:
  - `authToken.js` – JWT signing/verification (access + refresh tokens)
  - `geo.js` – Haversine distance formula for geolocation attendance
  - `summariser.js` – Extractive text summarizer for notice auto-summaries
  - `upload.js` – Multer file upload configuration with per-module sub-folders
- `modules/`: domain-based feature modules
  - `auth/` – User model, register/login/refresh/logout controllers, express-validator rules
  - `campus/` – Campus snapshot model and overview endpoint
  - `dashboard/` – Role-specific dashboard data generators (student/teacher/admin)
  - `health/` – Health check endpoint
  - `location/` – CampusLocation model, CRUD, auto-seed BBD NIIT Lucknow
  - `attendance/` – Session + Record models, QR code generation, geolocation marking, auto percentage
  - `notice/` – Notice model with file attachments, AI summarization, priority, read tracking
  - `complaint/` – Complaint model with categories, status tracking, response thread
  - `utilities/` – Notes sharing, Lost & Found, Peer Discussion (3 sub-modules, 1 combined router)
- `middleware/`: shared request/response middleware
  - `auth.js` – JWT protect, role-based authorize, dashboard role guard
  - `errorHandler.js` – Global error handler
  - `notFound.js` – 404 catch-all
- `uploads/`: static file storage (notices/, notes/)

## Frontend

- `api/`: Axios client with JWT auto-attach and transparent refresh
- `context/`: AuthContext provider (register, login, logout, fetchMe)
- `components/`: reusable UI sections (Navbar, Hero3D, Modules, ImpactStats, FooterCTA)
- `hooks/`: interaction and behavior hooks (useMouseParallax)
- `pages/`: route-based page components
  - `auth/` – LoginPage, RegisterPage (glassmorphic design)
  - `dashboard/` – DashboardPage (sidebar shell), OverviewPanel (stats + account)
  - `attendance/` – AttendancePage (teacher session mgmt / student GPS marking)
  - `notices/` – NoticePage (board, compose, attachments, AI summary)
  - `complaints/` – ComplaintPage (raise, track status, response thread)
  - `utilities/` – UtilitiesPage (tabbed: Notes, Lost & Found, Discussion)
  - `locations/` – CampusLocationsPage (admin GPS coordinate manager)
- The dashboard uses a sidebar layout for module navigation.
- The landing page is intentionally componentized for future portal integrations.
