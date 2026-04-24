# Bhojan Setu 🌱

**Bhojan Setu** (meaning "Bridge of Food") is a comprehensive, MERN-stack social impact platform designed to bridge the gap between surplus food and communities in need. It connects individuals and restaurants with local NGOs to ensure leftover food is rescued and distributed efficiently, minimizing food waste and maximizing social impact.

## 🚀 Features

- **Role-Based Access**: Custom dashboards and workflows for **Individuals**, **Restaurants**, and **NGOs**.
- **Real-Time Rescue Tracking**: Track the status of your food donations live (Pending -> Accepted -> In Transit -> Delivered) using React Query polling.
- **Smart Analytics**: Restaurants get detailed insights, trends, and waste efficiency analytics powered by `recharts`.
- **Geolocation Integration**: Donors can instantly locate and sort nearby NGOs based on their exact coordinates.
- **Gamification & Impact Badges**: Users earn "Impact Points" and unlock badges (e.g., *Waste Warrior*, *Community Hero*) based on their donation history.
- **Modern UI/UX**: Features a premium dark-themed interface, smooth skeleton loaders, dynamic framer-motion animations, and sleek toast notifications using `sonner`.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion, Recharts, React Router, React Query.
- **Backend**: Node.js, Express, Mongoose (MongoDB), Zod (Schema Validation), Express Rate Limit.
- **Authentication**: JWT (JSON Web Tokens).

## 💻 Running Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd FSDNew
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bhojan-setu
JWT_SECRET=your_super_secret_jwt_key
```
Start the backend development server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the frontend Vite server:
```bash
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:5173` in your browser. You can open multiple windows to test the full donor-to-NGO workflow!

---
*Built with ❤️ to fight food waste.*
