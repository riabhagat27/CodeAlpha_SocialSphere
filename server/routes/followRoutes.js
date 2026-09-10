const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken, optionalToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Follow a user
router.post('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const followerId = req.user.id;

    if (followerId === targetUserId) {
      return res.status(400).json({ error: 'You cannot follow yourself.' });
    }

    // Verify target user exists
    const targetUser = await dbGet('SELECT id FROM users WHERE id = ?', [targetUserId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User to follow not found.' });
    }

    // Check existing follow
    const existing = await dbGet(
      'SELECT id FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, targetUserId]
    );

    if (existing) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }

    await dbRun(
      'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
      [followerId, targetUserId]
    );

    // Get updated follower count
    const followerCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUserId]);

    res.json({
      message: 'User followed successfully!',
      is_following: true,
      followers_count: followerCountRow ? followerCountRow.count : 0
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'You are already following this user.' });
    }
    console.error('Follow User Error:', err);
    res.status(500).json({ error: 'Failed to follow user.' });
  }
});

// Unfollow a user
router.delete('/:id/follow', authenticateToken, async (req, res) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const followerId = req.user.id;

    await dbRun(
      'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
      [followerId, targetUserId]
    );

    // Get updated follower count
    const followerCountRow = await dbGet('SELECT COUNT(*) as count FROM follows WHERE following_id = ?', [targetUserId]);

    res.json({
      message: 'User unfollowed successfully!',
      is_following: false,
      followers_count: followerCountRow ? followerCountRow.count : 0
    });
  } catch (err) {
    console.error('Unfollow User Error:', err);
    res.status(500).json({ error: 'Failed to unfollow user.' });
  }
});

// Get followers list
router.get('/:id/followers', optionalToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const followers = await dbAll(
      `SELECT u.id, u.full_name, u.username, u.profile_image, u.bio
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ followers });
  } catch (err) {
    console.error('Get Followers Error:', err);
    res.status(500).json({ error: 'Failed to fetch followers list.' });
  }
});

// Get following list
router.get('/:id/following', optionalToken, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    const following = await dbAll(
      `SELECT u.id, u.full_name, u.username, u.profile_image, u.bio
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ following });
  } catch (err) {
    console.error('Get Following Error:', err);
    res.status(500).json({ error: 'Failed to fetch following list.' });
  }
});

module.exports = router;
