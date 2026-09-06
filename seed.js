const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');
const Event = require('./models/Event');
const CheckInLog = require('./models/CheckInLog');

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to Database');

    await User.deleteMany();
    await Event.deleteMany();
    await CheckInLog.deleteMany();

    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'College Admin',
      email: 'admin@college.edu',
      studentId: 'ADMIN001',
      password: adminPassword,
      role: 'admin'
    });

    const studentPassword = await bcrypt.hash('student123', 10);
    await User.create({
      name: 'Test Student',
      email: process.env.EMAIL_USER,
      studentId: 'STU12345',
      password: studentPassword,
      role: 'student'
    });

    const newEvent = await Event.create({
      title: 'Campus Hackathon 2026',
      description: 'Annual campus hackathon',
      location: 'Main Hall',
      date: '2026-04-15',
      time: '09:00 AM',
      capacity: 100
    });

    console.log('✅ Database seeded successfully!');
    console.log(`🎟️  Test Event ID: ${newEvent._id}`);
    process.exit();
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
