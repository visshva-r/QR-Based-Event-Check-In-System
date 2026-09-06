const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

dotenv.config();

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/event');
const adminRoutes = require('./routes/admin');

const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.status(200).json({ message: 'API is awake and working perfectly!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('auth'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    next(new Error('auth'));
  }
});

io.on('connection', (socket) => {
  if (socket.user?.role === 'admin') socket.join('admin');
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`Server running on port ${PORT}`)))
  .catch((err) => console.error('Database connection failed:', err));
