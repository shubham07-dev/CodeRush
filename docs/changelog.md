# Smart Campus OS – Change Log

## v1.2.0 – Feature Expansion (2026-04-12)

### 📋 Smart Attendance System

#### New Files
- `server/src/modules/attendance/attendance.model.js` – AttendanceSession & AttendanceRecord schemas
- `server/src/modules/attendance/attendance.controller.js` – Session CRUD, geolocation-locked marking, auto percentage
- `server/src/modules/attendance/attendance.routes.js` – 6 endpoints with RBAC
- `server/src/modules/attendance/attendance.validation.js` – express-validator chains
- `server/src/modules/location/location.model.js` – CampusLocation schema (GPS coordinates)
- `server/src/modules/location/location.controller.js` – CRUD + auto-seed BBD NIIT Lucknow (26.886316, 81.059048)
- `server/src/modules/location/location.routes.js` – Admin-only location management
- `server/src/utils/geo.js` – Haversine distance formula for geofencing
- `client/src/pages/attendance/AttendancePage.jsx` – Teacher: create sessions, view records; Student: enter code + GPS verify
- `client/src/pages/locations/CampusLocationsPage.jsx` – Admin manages campus GPS coordinates

### 📢 Smart Notice System

#### New Files
- `server/src/modules/notice/notice.model.js` – Notice schema with file attachments, priority, target roles, read tracking
- `server/src/modules/notice/notice.controller.js` – CRUD with AI summarization and file upload support
- `server/src/modules/notice/notice.routes.js` – 4 endpoints with multer file upload (up to 5 files)
- `server/src/utils/summariser.js` – Extractive text summarizer (pure JS, no external AI dependency)
- `server/src/utils/upload.js` – Multer configuration with per-module sub-folders
- `client/src/pages/notices/NoticePage.jsx` – Notice board with compose form, priority badges, attachment downloads

### 🔧 Complaint Management

#### New Files
- `server/src/modules/complaint/complaint.model.js` – Complaint schema with categories, status tracking, response thread
- `server/src/modules/complaint/complaint.controller.js` – Raise, list, update status, respond
- `server/src/modules/complaint/complaint.routes.js` – 5 endpoints
- `server/src/modules/complaint/complaint.validation.js` – Validation chains
- `client/src/pages/complaints/ComplaintPage.jsx` – Status filter, complaint form, response thread view

### 🛠️ Student Utilities

#### New Files
- `server/src/modules/utilities/notes.model.js` – Shared notes with file upload
- `server/src/modules/utilities/notes.controller.js` – Notes CRUD
- `server/src/modules/utilities/lostfound.model.js` – Lost & Found items
- `server/src/modules/utilities/lostfound.controller.js` – Post, filter, claim
- `server/src/modules/utilities/discussion.model.js` – Peer Q&A with answers, tags, solved status
- `server/src/modules/utilities/discussion.controller.js` – Questions, answers, solved toggle
- `server/src/modules/utilities/utilities.routes.js` – Combined router (10 endpoints)
- `server/src/modules/utilities/utilities.validation.js` – Validation chains for all 3 sub-modules
- `client/src/pages/utilities/UtilitiesPage.jsx` – Tabbed UI: Notes, Lost & Found, Discussion

### 🏗️ Dashboard Overhaul

#### Modified Files
- `client/src/pages/dashboard/DashboardPage.jsx` – Converted to shell layout with sidebar navigation + module content switching
- `client/src/pages/dashboard/OverviewPanel.jsx` – **[NEW]** Extracted original dashboard content into standalone panel

#### Modified Files
- `server/src/app.js` – Registered 5 new route modules, added static file serving for uploads, updated helmet CORS policy
- `server/src/server.js` – Added auto-seeding of default campus location on startup
- `client/src/styles.css` – Added 800+ lines: sidebar layout, module pages, tables, forms, badges, tabs, progress bars, thread views, responsive breakpoints

### 📦 Dependencies
- `server/package.json` – Added `multer` for file uploads

### 📐 Architecture Summary
- **New API endpoints**: 25+ across 5 new modules
- **New backend files**: 20
- **New frontend pages**: 6 (Attendance, Notices, Complaints, Utilities, Campus Locations, OverviewPanel)
- **Design pattern**: All modules follow `model → controller → routes → validation` pattern
- **CSS design**: All new UI uses existing cream/brown glassmorphism tokens

---

## v1.1.0 – JWT Auth & RBAC System (2026-04-12)

### 🔐 Backend – Authentication & Authorization
- User model with bcrypt password hashing and refresh token rotation
- Register, login, refresh, logout controllers with express-validator
- JWT protect middleware with specific error handling
- Role-based authorization middleware (student, teacher, admin)

### 🎨 Frontend – Auth UI & Dashboard
- AuthContext provider with Axios interceptors for auto token refresh
- LoginPage and RegisterPage with glassmorphic design
- Role-aware DashboardPage
- Navbar with Sign In / Get Started buttons

### 📦 Dependencies
- Backend: `express-validator`
- Frontend: `axios`

### ⚙️ Configuration
- `.env` – JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN
