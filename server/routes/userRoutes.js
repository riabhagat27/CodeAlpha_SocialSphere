const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken, optionalToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Search users by query string (username or full_name)
router.get('/search', optionalToken, async (req, res) => {
  try {
    const query = req.query.q ? req.query.q.trim() : '';

    if (!query) {
      return res.json({ users: [] });
    }

    const searchTerm = `%${query}%`;
    const users = await dbAll(
      `SELECT id, full_name, username, bio, profile_image 
       FROM users 
       WHERE username LIKE ? OR full_name LIKE ? 
       LIMIT 20`,
      [searchTerm, searchTerm]
    );

    res.json({ users });
  } catch (err) {
    console.error('Search Users Error:', err);
    res.status(500).json({ error: 'Failed to search users.' });
  }
});

// Get User Profile details + statistics
router.get('/:id', optionalToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID.' });
    }

    const user = await dbGet(
      'SELECT id, full_name, username, email, bio, profile_image, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Calculate post count
    const postCountRow = await dbGet('SELECT COUNT(*) as count FROM posts WHERE user_id = ?', [userId]);
    // Calculate followers count
    const followerCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [userId]);
    // Calculate following count
    const followingCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE follower_id = ?', [userId]);

    // Check if current authenticated user is following this profile
    let isFollowing = false;
    if (req.user && req.user.id !== userId) {
      const followRow = await dbGet(
        'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
        [req.user.id, userId]
      );
      isFollowing = !!followRow;
    }

    res.json({
      user: {
        ...user,
        posts_count: postCountRow ? postCountRow.count : 0,
        followers_count: followerCountRow ? followerCountRow.count : 0,
        following_count: followingCountRow ? followingCountRow.count : 0,
        is_following: isFollowing,
        is_self: req.user ? req.user.id === userId : false
      }
    });
  } catch (err) {
    console.error('Get User Error:', err);
    res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// Update Profile
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden. You can only edit your own profile.' });
    }

    const { full_name, bio, profile_image } = req.body;

    if (!full_name || full_name.trim() === '') {
      return res.status(400).json({ error: 'Full name cannot be empty.' });
    }

    await dbRun(
      'UPDATE users SET full_name = ?, bio = ?, profile_image = ? WHERE id = ?',
      [
        full_name.trim(),
        bio !== undefined ? bio.trim() : '',
        profile_image !== undefined && profile_image.trim() !== '' 
          ? profile_image.trim() 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(full_name.trim())}&background=6366f1&color=fff`,
        userId
      ]
    );

    const updatedUser = await dbGet(
      'SELECT id, full_name, username, email, bio, profile_image, created_at FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profile updated successfully!',
      user: updatedUser
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

module.exports = router;
