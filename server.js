const express= require('express');
const mongoose= require('mongoose');
const dotenv= require('dotenv');
const authRoutes= require('./routes/auth');
const eventRoutes= require('./routes/event');
const adminRoutes= require('./routes/admin');
const cors= require('cors');

const app= express();
dotenv.config();
app.use(cors());
app.use(express.json());

// ——— Quick Test Route ———
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});
// ————————————————

// Routes
app.use('/api/auth',authRoutes);
app.use('/api/events',eventRoutes);
app.use('/api/admin',adminRoutes);

// Connect to database and start server
mongoose.connect(process.env.MONGO_URI)
  .then(()=> app.listen(5000, () => console.log('Server running on port 5000')))
  .catch((err)=> console.error(err));
