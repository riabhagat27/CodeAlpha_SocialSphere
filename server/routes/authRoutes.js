const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database');
const { JWT_SECRET, authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Email validation helper
const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { full_name, username, email, password } = req.body;

    // Basic Validation
    if (!full_name || !username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required (full name, username, email, password).' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check unique username
    const existingUser = await dbGet('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken. Please choose another.' });
    }

    // Check unique email
    const existingEmail = await dbGet('SELECT * FROM users WHERE email = ?', [email.trim().toLowerCase()]);
    if (existingEmail) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Default profile avatar based on name
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name)}&background=6366f1&color=fff`;

    // Insert user
    const result = await dbRun(
      'INSERT INTO users (full_name, username, email, password, profile_image) VALUES (?, ?, ?, ?, ?)',
      [full_name.trim(), username.trim(), email.trim().toLowerCase(), hashedPassword, defaultAvatar]
    );

    const newUser = {
      id: result.lastID,
      full_name: full_name.trim(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      bio: '',
      profile_image: defaultAvatar
    };

    // Generate JWT token
    const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'Registration successful!',
      token,
      user: newUser
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ error: 'Server error during registration. Please try again.' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { login, password } = req.body; // login can be username or email

    if (!login || !password) {
      return res.status(400).json({ error: 'Please enter your username/email and password.' });
    }

    // Find user by username or email
    const user = await dbGet(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [login.trim(), login.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials. User not found.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials. Password incorrect.' });
    }

    const payload = {
      id: user.id,
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      bio: user.bio,
      profile_image: user.profile_image
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful!',
      token,
      user: payload
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Get current user details
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, full_name, username, email, bio, profile_image, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ error: 'Failed to fetch user data.' });
  }
});

// Logout (Client side deletes token, endpoint returns standard message)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
