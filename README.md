# Gate (campus check-in)

Campus event check-in for students and door staff. Students keep a signed pass on their phone. Staff scan at the door. Waitlists fill open seats. Every scan hits a live log.

Students see paper-style passes. Staff get a desk view and a fullscreen door screen (**IN** / **ALREADY IN** / **INVALID**). QR codes are HMAC-signed, so plain `userId-eventId` strings do not work.

Runs locally. `npm test` checks ticket signatures and waitlist order.

---

## Features

| Feature | Description |
|:-------|:------------|
| **Auth** | Signup always creates a student. Admins come from seed only. JWT expires in 8 hours. |
| **Signed tickets** | QR payload is `{ eventId, userId, ticketId }` plus HMAC. Tampered codes fail at the door. |
| **In-app passes** | Paper-style pass with name, event, and QR. Registration works even if email fails. |
| **Capacity + waitlist** | First-come seats. Full events go to a waitlist. Cancel before check-in and the next person gets a pass. |
| **Live multi-scanner** | Socket.io pushes check-ins to every staff desk. Audit log records who scanned whom and when. |
| **Per-event admin** | Attendees, waitlist, check-in %, CSV/JSON export per event. |

---

## Tech stack

| Layer | Technology |
|:------|:------------|
| **Backend** | Node.js, Express, Socket.io |
| **Frontend** | Next.js 16, React 19, Tailwind, IBM Plex |
| **Database** | MongoDB (Mongoose) |
| **Auth** | JWT (8h), bcryptjs, express-rate-limit |
| **Tickets** | HMAC-SHA256 (`QR_SECRET` or `JWT_SECRET`) |
| **Email** | Nodemailer (sends a copy of the pass) |
| **QR** | qrcode (server), html5-qrcode (scanner) |

---

## How to run

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- Gmail app password if you want email passes

### Backend

```bash
npm install
cp .env.example .env
```

`.env`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
QR_SECRET=your_qr_hmac_secret
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
FRONTEND_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
```

`QR_SECRET` signs tickets. Falls back to `JWT_SECRET` if unset.  
`FRONTEND_ORIGIN` is the CORS/Socket.io allowlist (comma-separated). Add your deployed frontend URL when needed.

```bash
node seed.js    # optional
npm run dev     # http://localhost:5000
npm test
```

### Frontend

```bash
cd frontend-event-scanner
npm install
```

`.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
npm run dev     # http://localhost:3000
```

---

## Test accounts (after seed)

| Role | Email | Password |
|:-----|:------|:---------|
| Admin | admin@college.edu | admin123 |
| Student | *(your EMAIL_USER)* | student123 |

Seeded event **Campus Hackathon 2026**, capacity **100**.

---

## Tickets

1. Register creates a `ticketId` (UUID) on the attendee. QR images are not stored in Mongo.
2. The QR is `base64url(payload).hmac` where payload is `{ e: eventId, u: userId, t: ticketId }`.
3. The app generates the PNG on demand. Same token every time.
4. Check-in: `POST /api/events/checkin` with `{ token }`. Bad signatures are rejected.

Old `userId-eventId` codes will not scan. Re-register for a signed pass.

---

## Waitlist

- Seat free → you register and get a pass.
- Full → you join the waitlist (position shown on your card).
- Cancel before check-in → first waitlisted student gets promoted and emailed if mail is set up.

Try it: capacity **1**, two students register, first cancels, second gets the seat.

---

## Multi-scanner demo

1. **Door** on a phone (or second browser with a camera).
2. Staff desk on a laptop.
3. Scan a pass. The live log updates. Scan again → **ALREADY IN**.
4. Open the desk on another device. Both stay in sync.

---

## API

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| POST | `/api/auth/register` | - | Student account (role from client is ignored) |
| POST | `/api/auth/login` | - | Login, JWT (8h) |
| GET | `/api/auth/me` | Any | Current user |
| GET | `/api/events` | Optional | Public list, no attendee/QR leak |
| POST | `/api/events/register/:id` | Student | Register or waitlist |
| POST | `/api/events/unregister/:id` | Student | Cancel or leave waitlist |
| GET | `/api/events/:id/ticket` | Student | Signed QR for the owner |
| POST | `/api/events/checkin` | Admin | `{ token }`, verify HMAC |
| GET | `/api/events/export/:eventId` | Admin | JSON export |
| GET | `/api/admin/events` | Admin | Events with stats |
| GET | `/api/admin/events/:id` | Admin | Single event |
| GET | `/api/admin/logs` | Admin | Check-in log, newest first |
| POST | `/api/admin/create` | Admin | Create event (`capacity` required) |
| GET | `/api/admin/export/:id` | Admin | CSV export |

Login and register: 20 requests per 15 minutes.

---

## 60-second demo (for interviews)

1. Student signup (cannot become staff from this form).
2. Take a seat, open pass.
3. Staff door scan → **IN** + name on the log.
4. Scan again → **ALREADY IN**.
5. Capacity-1 event, two students, first drops → second promoted.

**Resume:** Gate. Signed QR passes, waitlists, live door scanning. Node, Express, Next.js, MongoDB.

---

## Layout

```
├── server.js
├── routes/
├── models/
├── middleware/
├── utils/
├── test/
├── seed.js
└── frontend-event-scanner/
```

---

## License

ISC
