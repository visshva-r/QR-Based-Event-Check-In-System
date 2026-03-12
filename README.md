# 🎟️ QR-Based Event Check-In System (Backend API)

A robust Node.js/Express backend system designed to manage campus event registrations and secure check-ins. The system dynamically generates unique QR code tickets, automatically dispatches them via email, and provides a secure scanning endpoint for event administrators.

---

## 🚀 Key Engineering Highlights
* **Dynamic Media Generation:** Engineered on-the-fly QR code generation linking MongoDB `user_ids` and `event_ids` for secure attendee verification.
* **Automated Email Dispatch:** Overcame standard email client Base64 image blocking by utilizing **Nodemailer** with embedded Content-ID (CID) attachments to reliably deliver QR tickets directly to user inboxes.
* **Secure Role-Based Access (RBAC):** Implemented custom **JWT middleware** to strictly separate `student` registration routes from `admin` check-in and data export routes.
* **Data Extraction:** Built an admin endpoint utilizing `json2csv` to instantly compile and export real-time attendee check-in data.

---

## ✨ Features
✅ **Authentication:** Secure Student and Admin login via JWT.
✅ **Event Management:** Admins can create and manage event details.
✅ **Automated Ticketing:** Students register and instantly receive a custom QR code via email.
✅ **Secure Scanner API:** Check-in endpoint validates the QR payload against the database to prevent duplicate entries.
✅ **Admin Dashboard API:** Export live attendee lists to JSON or CSV formats.

---

## 🧠 Tech Stack
| Layer | Technology |
|:------|:------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas |
| **ODM** | Mongoose |
| **Authentication**| JSON Web Tokens (JWT) & bcryptjs |
| **Email Service** | Nodemailer |
| **Utilities** | qrcode, json2csv |

---

## 🛠️ Local Setup Instructions

**1. Clone the repository:**
```bash
git clone [https://github.com/visshva-r/QR-Based-Event-Check-In-System.git](https://github.com/visshva-r/QR-Based-Event-Check-In-System.git)
cd QR-Based-Event-Check-In-System