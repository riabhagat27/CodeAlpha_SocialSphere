require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./database');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const likeRoutes = require('./routes/likeRoutes');
const commentRoutes = require('./routes/commentRoutes');
const followRoutes = require('./routes/followRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', followRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', likeRoutes);
app.use('/api', commentRoutes);

// Unmatched API Route Handler
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Fallback for HTML SPA routing (serves index.html for unmatched non-API GET routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error. Something went wrong.' });
});

// Initialize Database & Start Server
const startServer = async () => {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 SocialSphere Server running at http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
};

startServer();
