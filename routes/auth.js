const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const auth = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, try again later' },
});

router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password, studentId } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      name,
      email,
      password: hashed,
      studentId,
      role: 'student',
    });
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId });
  } catch (e) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({
    token,
    user: { id: user._id, name: user.name, role: user.role, email: user.email, studentId: user.studentId },
  });
});

router.get('/me', auth(), async (req, res) => {
  const user = await User.findById(req.user.id).select('name email role studentId');
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    studentId: user.studentId,
  });
});

module.exports = router;
