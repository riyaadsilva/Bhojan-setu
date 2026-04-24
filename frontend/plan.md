# BhojanSetu — Role Selection, Login & Role-Based Landing Pages

## Overview

Add a role-selection screen and login forms between the About page and the Landing page. After login, show a customized landing page based on the user's role (Individual, Restaurant/Caterer, NGO). UI-only auth with mock data for analytics.

## Flow

```text
/ (Intro) → /experience (Video) → /about (Scroll) → /select-role (NEW) → /login (NEW) → /dashboard (NEW, role-based)
```

## What gets built

### 1. Role Selection Page (`/select-role`)

- Dark themed page matching existing aesthetic (Playfair Display + DM Sans, #0f0e0b bg)
- "Before we start… who are you?" heading
- Three animated cards: **Individual**, **Restaurant / Caterer**, **NGO**
- Clicking a card navigates to `/login?role=individual|restaurant|ngo`
- About page "Get Started" button routes here instead of `/landing`

### 2. Login/Register Page (`/login`)

- Reads `role` from URL query param
- Tab toggle: Login / Register
- Role-specific registration fields:
  - **Individual**: Name, Phone, Email, Location
  - **Restaurant/Caterer**: Business Name, Owner Name, FSSAI License No., Phone, Business Email, Address, Cuisine Type
  - **NGO**: NGO Name, Registration Number, Website, Phone, Email, Operating Area, Cause Focus
- Login form (all roles): Email + Password
- On submit → stores role + user info in React context/localStorage → navigates to `/dashboard`
- No real backend — just stores form data client-side

### 3. Auth Context

- Simple React context (`UserContext`) holding `{ role, profile, isLoggedIn }`
- Persists to localStorage so refresh keeps session
- Logout clears it and returns to `/select-role`

### 4. Role-Based Dashboard (`/dashboard`)

Uses the existing `MainLanding` layout (same nav, hero, how-it-works structure) but adapts content per role:

#### Individual

- Nav links: Home, **Contact NGOs** (instead of Partner NGOs), Impact Stories, Blog
- No "Production Analytics" link
- Hero text tweaked: "Every meal you share matters"
- Impact Stories section → news about how donations help people
- Blog section → personal donation history, photos

#### Restaurant / Caterer

- Nav links: Home, Production Analytics, Partner NGOs, Impact Stories, Blog
- Below hero: **Food Log form** (the existing `Home.jsx` / `FoodLog` component embedded inline)
- Below food log: **Production Analytics Chart** — a line chart (using Recharts) with:
  - X-axis: days of the week (Mon–Sun)
  - Y-axis: percentage (0–100)
  - Yellow line: food produced
  - Blue line: food consumed
  - Red line: food wasted
  - Summary card on top: "You saved X kg this week" / "X% waste reduction"
- Mock data for the chart (7 days)

#### NGO

- Nav links: Home, Connected Restaurants, Impact Stories, Blog
- Below hero: Stats cards (people helped, restaurants connected, meals distributed)
- News/stories section about their impact

### 5. File Structure (new files)

```
src/pages/SelectRole.tsx        — Role picker page
src/pages/SelectRole.css        — Styles
src/pages/Login.tsx             — Login/Register forms
src/pages/Login.css             — Styles
src/pages/Dashboard.tsx         — Role-based landing page
src/pages/Dashboard.css         — Styles
src/components/FoodLogSection.tsx — Extracted food log (from Home.jsx logic)
src/components/AnalyticsChart.tsx — Recharts line chart with mock data
src/components/NGODashboard.tsx  — NGO-specific content section
src/contexts/UserContext.tsx     — Auth context + provider
```

### 6. Modified Files

- **App.tsx** — Add new routes, wrap with `UserProvider`
- **About page** (will be recreated as `src/pages/About.tsx`) — "Get Started" → `/select-role`
- **src/pages/Index.tsx** — Recreate as Intro page
- All existing pages (Intro, Apple, About, MainLanding, Home) recreated as `.tsx` files with their CSS

### 7. Dependencies

- `recharts` — for the analytics line chart
- `framer-motion` — already used, will add to package.json
- `@supabase/supabase-js` — already used in Home.jsx, will keep for food log functionality

### Technical Notes

- Existing Supabase food_logs integration preserved as-is in the FoodLog component
- Chart uses static mock data array; easy to swap for real queries later
- All styling follows existing dark theme conventions (#0f0e0b, #FF5722, Playfair Display)
- Framer Motion animations consistent with existing pages
