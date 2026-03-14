# 🎟️ QR-Based Event Check-In System

A full-stack system for campus event registrations and secure QR-based check-ins. Students register for events and receive unique QR code tickets via email. Admins scan QR codes at the venue for instant check-in.

**Status:** Tested; builds and runs without errors. Frontend uses responsive layout and consistent typography (Inter, Tailwind CSS).

---

## 🚀 Key Features

| Feature | Description |
|:-------|:------------|
| **Authentication** | Student & Admin login via JWT. Sign up for new student accounts. |
| **Event Management** | Admins create events from the dashboard. Students browse and register. |
| **Automated Ticketing** | QR codes generated on registration and emailed via Nodemailer (CID attachments). |
| **QR Scanner** | Admin scanner validates QR payloads and prevents duplicate check-ins. |
| **Export** | Export attendee lists as CSV or JSON per event. |
| **Live Dashboard** | Real-time stats and entry logs with attendee names/emails. |

---

## 🧠 Tech Stack

| Layer | Technology |
|:------|:------------|
| **Backend** | Node.js, Express.js |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT, bcryptjs |
| **Email** | Nodemailer |
| **QR** | qrcode, html5-qrcode |

---

## 🛠️ How to Run the Project

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Gmail account (for sending QR tickets)

### 1. Clone the repository

```bash
git clone https://github.com/visshva-r/QR-Based-Event-Check-In-System.git
cd QR-Based-Event-Check-In-System
```

### 2. Backend setup

```bash
# Install dependencies
npm install

# Create .env file (copy from example)
cp .env.example .env

# Edit .env with your values:
# MONGO_URI=your_mongodb_connection_string
# JWT_SECRET=your_jwt_secret_key
# EMAIL_USER=your_gmail_address
# EMAIL_PASS=your_gmail_app_password
```

**Gmail App Password:** Use [App Passwords](https://support.google.com/accounts/answer/185833) if 2FA is enabled.

### 3. Seed the database (optional)

```bash
node seed.js
```

This creates:
- **Admin:** `admin@college.edu` / `admin123`
- **Student:** Uses `EMAIL_USER` from `.env` / `student123`
- **Test event:** Campus Hackathon 2026

### 4. Start the backend

```bash
npm run dev
# or: npm start
```

Backend runs at **http://localhost:5000**

### 5. Frontend setup

```bash
cd frontend-event-scanner

# Install dependencies
npm install

# For local development, create .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 6. Start the frontend

```bash
npm run dev
```

Frontend runs at **http://localhost:3000**

---

## 📋 Quick Start Summary

```bash
# Terminal 1 - Backend
npm install
cp .env.example .env   # Edit with your values
node seed.js          # Optional: seed test data
npm run dev

# Terminal 2 - Frontend
cd frontend-event-scanner
npm install
# Add .env.local with NEXT_PUBLIC_API_URL=http://localhost:5000/api for local API
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 🔐 Test Accounts (after seeding)

| Role | Email | Password |
|:-----|:------|:---------|
| Admin | admin@college.edu | admin123 |
| Student | *(your EMAIL_USER)* | student123 |

---

## 📁 Project Structure

```
├── server.js              # Express app entry
├── routes/                 # auth, event, admin
├── models/                 # User, Event
├── middleware/             # JWT auth
├── seed.js                 # Database seeder
├── .env.example
└── frontend-event-scanner/ # Next.js app
    ├── src/app/
    │   ├── page.tsx        # Login
    │   ├── register/       # Sign up
    │   ├── admin/          # Dashboard, Scanner
    │   └── student/        # Event list & registration
    └── src/components/     # Navbar, ProtectedRoute
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:-------------|
| POST | `/api/auth/register` | - | Create student account |
| POST | `/api/auth/login` | - | Login, returns JWT |
| GET | `/api/events` | - | List all events |
| POST | `/api/events/register/:id` | Student | Register for event |
| POST | `/api/events/checkin/:eventId/:userId` | Admin | Check-in via QR |
| GET | `/api/events/export/:eventId` | Admin | Export JSON |
| GET | `/api/admin/events` | Admin | Events with populated attendees |
| POST | `/api/admin/create` | Admin | Create event |
| GET | `/api/admin/export/:id` | Admin | Export CSV |

---

## 📄 License

ISC
