# Smart Campus OS – Change Log

## v1.1.0 – JWT Auth & RBAC System (2026-04-12)

### 🔐 Backend – Authentication & Authorization

#### New Files
- `server/src/modules/auth/auth.validation.js` – Express-validator rules for register, login, and refresh-token endpoints

#### Modified Files
- `server/src/config/env.js`
  - Added `jwtRefreshSecret` and `jwtRefreshExpiresIn` environment variables
  - Updated default JWT expiry from `7d` to `1d` for access tokens
  
- `server/src/utils/authToken.js`
  - Added `verifyAccessToken()` function
  - Added `signRefreshToken()` and `verifyRefreshToken()` for refresh-token rotation

- `server/src/modules/auth/auth.model.js`
  - Added `refreshToken` field (select: false) for server-side token persistence
  - Added comprehensive comments throughout the schema

- `server/src/modules/auth/auth.controller.js`
  - Updated `register()` to return both access + refresh tokens
  - Updated `login()` to return both access + refresh tokens with rotation
  - Added `refreshAccessToken()` – POST /api/v1/auth/refresh
  - Added `logout()` – POST /api/v1/auth/logout (invalidates refresh token)

- `server/src/modules/auth/auth.routes.js`
  - Added `POST /refresh` with `refreshValidation` middleware
  - Added `POST /logout` with `protect` middleware
  - Integrated express-validator on register and login endpoints

- `server/src/middleware/auth.js`
  - Enhanced `protect()` with specific `TokenExpiredError` and `JsonWebTokenError` handling
  - Added comprehensive inline documentation
  - Clearer error messages for different failure cases

### 🎨 Frontend – Auth UI & Dashboard

#### New Files
- `client/src/api/client.js` – Axios instance with automatic JWT attachment and transparent 401 refresh
- `client/src/context/AuthContext.jsx` – React context for auth state (register, login, logout, fetchMe)
- `client/src/pages/auth/LoginPage.jsx` – Login form with glassmorphic cream/brown design
- `client/src/pages/auth/RegisterPage.jsx` – Register form with role-selection cards
- `client/src/pages/dashboard/DashboardPage.jsx` – Role-specific dashboard after login

#### Modified Files
- `client/src/App.jsx`
  - Wrapped in `AuthProvider`
  - Added view-state routing: landing → login → register → dashboard

- `client/src/components/Navbar.jsx`
  - Added "Sign In" (ghost) and "Get Started" (primary) buttons
  - Wired to auth page navigation callbacks

- `client/src/components/Hero3D.jsx`
  - Changed CTA to "Get Started Free" wired to registration flow

- `client/src/components/FooterCTA.jsx`
  - Wired CTA button to registration flow

- `client/src/styles.css`
  - Added CSS custom properties (`--accent`, `--accent-dark`, `--accent-glow`, etc.)
  - Added complete auth page styles (glass card, floating orbs, input fields, role grid)
  - Added dashboard styles (header, hero greeting, stat cards, focus cards, account grid)
  - Added animations: `authSlideIn`, `shake`, `spin`
  - Added hover micro-animations with subtle transforms
  - Added responsive breakpoints for auth and dashboard layouts

### 📦 Dependencies

- `client/package.json` – Added `axios` for API communication
- `server/package.json` – Added `express-validator` for input validation

### ⚙️ Configuration

- `.env.example` – Added `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`
- `.env` – Created with development defaults

### 📐 Architecture Decisions

1. **Refresh Token Rotation**: Each refresh issues a new token pair, preventing replay attacks
2. **Token Storage**: Access + refresh tokens stored in `localStorage` (suitable for SPA; consider httpOnly cookies for production)
3. **Auto-Refresh**: Axios interceptor transparently refreshes expired access tokens
4. **Role-Based Dashboard**: Dashboard content is fetched from the server based on user role
5. **Input Validation**: Server-side validation using express-validator chains with structured error responses
