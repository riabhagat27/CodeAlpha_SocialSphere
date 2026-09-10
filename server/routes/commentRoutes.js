const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken, optionalToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get comments for a post
router.get('/posts/:id/comments', optionalToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user ? req.user.id : null;

    const comments = await dbAll(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        u.full_name,
        u.username,
        u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`,
      [postId]
    );

    comments.forEach(comment => {
      comment.is_owner = currentUserId ? comment.user_id === currentUserId : false;
    });

    res.json({ comments });
  } catch (err) {
    console.error('Get Comments Error:', err);
    res.status(500).json({ error: 'Failed to fetch comments.' });
  }
});

// Add a comment to a post
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const { content } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Comment content cannot be empty.' });
    }

    // Verify post exists
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const result = await dbRun(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, req.user.id, content.trim()]
    );

    const newComment = await dbGet(
      `SELECT 
        c.id,
        c.post_id,
        c.user_id,
        c.content,
        c.created_at,
        u.full_name,
        u.username,
        u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [result.lastID]
    );

    newComment.is_owner = true;

    // Get updated comment count for post
    const countRow = await dbGet('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [postId]);

    res.status(201).json({
      message: 'Comment added successfully!',
      comment: newComment,
      comment_count: countRow ? countRow.count : 0
    });
  } catch (err) {
    console.error('Add Comment Error:', err);
    res.status(500).json({ error: 'Failed to add comment.' });
  }
});

// Delete a comment
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = parseInt(req.params.id, 10);

    const comment = await dbGet('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own comments.' });
    }

    await dbRun('DELETE FROM comments WHERE id = ?', [commentId]);

    // Get updated comment count for post
    const countRow = await dbGet('SELECT COUNT(*) as count FROM comments WHERE post_id = ?', [comment.post_id]);

    res.json({
      message: 'Comment deleted successfully.',
      post_id: comment.post_id,
      comment_count: countRow ? countRow.count : 0
    });
  } catch (err) {
    console.error('Delete Comment Error:', err);
    res.status(500).json({ error: 'Failed to delete comment.' });
  }
});

module.exports = router;
