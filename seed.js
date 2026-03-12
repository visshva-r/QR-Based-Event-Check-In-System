const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust path if needed
const Event = require('./models/Event'); // Adjust path if needed

dotenv.config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Connected to Database');

    // Optional: Clear out old test data so you start fresh
    await User.deleteMany();
    await Event.deleteMany();

    // 1. Create an Admin
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'College Admin',
      email: 'admin@college.edu',
      studentId: 'ADMIN001',
      password: adminPassword,
      role: 'admin'
    });

    // 2. Create a Student (Using your email so YOU get the QR code!)
    const studentPassword = await bcrypt.hash('student123', 10);
    await User.create({
      name: 'Test Student',
      email: process.env.EMAIL_USER, // This sends the test email to your own Gmail
      studentId: 'STU12345',
      password: studentPassword,
      role: 'student'
    });

    // 3. Create a Test Event
    const newEvent = await Event.create({
      title: 'Campus Hackathon 2026',
      description: 'Annual 24-hour coding challenge',
      location: 'Main Auditorium',
      date: '2026-04-15',
      time: '09:00 AM'
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