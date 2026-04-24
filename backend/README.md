# Bhojan Setu Backend

Express API for the Bhojan Setu frontend. It stores user registrations, food logs, donation pickup requests, NGO listings, contact requests, impact stories, and dashboard analytics in MongoDB.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Add your MongoDB connection string to `backend/.env`:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bhojan-setu
```

3. Start the server:

```bash
npm run dev
```

The API runs on `http://localhost:5000/api` by default.

## Main Routes

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `GET /api/food-logs`
- `POST /api/food-logs`
- `GET /api/donations`
- `POST /api/donations`
- `PATCH /api/donations/:id/status`
- `PATCH /api/donations/:id/rating`
- `GET /api/ngos`
- `POST /api/ngos`
- `GET /api/contact-requests`
- `POST /api/contact-requests`
- `PATCH /api/contact-requests/:id/status`
- `GET /api/impact-stories`
- `POST /api/impact-stories`
- `GET /api/analytics/overview`

Use `Authorization: Bearer <token>` for protected user routes after login/register.
