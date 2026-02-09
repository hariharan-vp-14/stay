const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const { connectDB } = require('./db/db');
const userRoutes = require('./routes/user.routes');
const ownerRoutes = require('./routes/owner.routes');
const cookieParser = require('cookie-parser');
const cors = require('cors');

connectDB();

const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/owners', ownerRoutes);

module.exports = app;