const router= require('express').Router();
const bcrypt= require('bcryptjs');
const jwt= require('jsonwebtoken');
const User= require('../models/User');

router.post('/register', async (req, res) => {
  const {name,email,password,studentId,role }= req.body;
  const hashed= await bcrypt.hash(password,10);
  try {
    const user= await User.create({name,email,password: hashed,studentId,role });
    res.json(user);
  } catch (e) {
    res.status(400).json({ error:'Email already exists' });
  }
});

router.post('/login', async (req,res) => {
  const {email, password }= req.body;
  const user= await User.findOne({ email });
  if(!user) return res.status(400).json({ error: 'User not found' });
  const valid= await bcrypt.compare(password, user.password);
  if(!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token= jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET);
  res.json({ token });
});

module.exports = router;
