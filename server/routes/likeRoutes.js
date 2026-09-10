const express = require('express');
const { dbGet, dbRun } = require('../database');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Like a post
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Check if post exists
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Check if already liked
    const existingLike = await dbGet('SELECT id FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
    if (existingLike) {
      return res.status(400).json({ error: 'You have already liked this post.' });
    }

    await dbRun('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);

    // Fetch updated like count
    const countRow = await dbGet('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);

    res.json({
      message: 'Post liked successfully!',
      liked: true,
      like_count: countRow ? countRow.count : 0
    });
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'You have already liked this post.' });
    }
    console.error('Like Post Error:', err);
    res.status(500).json({ error: 'Failed to like post.' });
  }
});

// Unlike a post
router.delete('/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const userId = req.user.id;

    // Check if post exists
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    await dbRun('DELETE FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId]);

    // Fetch updated like count
    const countRow = await dbGet('SELECT COUNT(*) as count FROM likes WHERE post_id = ?', [postId]);

    res.json({
      message: 'Post unliked successfully!',
      liked: false,
      like_count: countRow ? countRow.count : 0
    });
  } catch (err) {
    console.error('Unlike Post Error:', err);
    res.status(500).json({ error: 'Failed to unlike post.' });
  }
});

module.exports = router;
