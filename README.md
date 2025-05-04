# QR-Based Event Check-In System

This backend system manages college event registrations and check-ins using QR codes. Users receive a QR code on successful registration, and organizers can scan it to mark attendance.

##  Technologies Used
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT
- **QR Code Generator:** qrcode (npm)
- **Emailing:** Nodemailer
- **Documentation:** Postman

---

##  Features

### 1. Authentication & Roles
- Register and login (JWT)
- Roles: `student` and `admin`

### 2. Event Management
- Admins can create events.
- Students can register for events.
- Generates and emails a QR code upon registration.

### 3. Check-in System
- Admin can scan QR to mark attendance.
- Prevents duplicate check-ins.

### 4. Admin Dashboard
- View all attendees.
- Track who has checked in.
- Export attendee list (JSON or CSV).

---

##  Setup Instructions

1. **Clone the repository:**
```bash
git clone https://github.com/<your-username>/QR-Based-Event-Check-In-System.git
cd QR-Based-Event-Check-In-System
