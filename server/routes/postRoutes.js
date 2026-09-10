const express = require('express');
const { dbGet, dbAll, dbRun } = require('../database');
const { authenticateToken, optionalToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Get Posts Feed (Global feed or filter by user_id)
router.get('/', optionalToken, async (req, res) => {
  try {
    const filterUserId = req.query.user_id ? parseInt(req.query.user_id, 10) : null;
    const currentUserId = req.user ? req.user.id : null;

    let sql = `
      SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        u.full_name,
        u.username,
        u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
    `;

    const params = [];
    if (filterUserId && !isNaN(filterUserId)) {
      sql += ` WHERE p.user_id = ?`;
      params.push(filterUserId);
    }

    sql += ` ORDER BY p.created_at DESC`;

    const posts = await dbAll(sql, params);

    // If user is authenticated, check which posts they have liked
    if (currentUserId && posts.length > 0) {
      const userLikes = await dbAll(
        'SELECT post_id FROM likes WHERE user_id = ?',
        [currentUserId]
      );
      const likedPostIds = new Set(userLikes.map(l => l.post_id));

      posts.forEach(post => {
        post.is_liked = likedPostIds.has(post.id);
        post.is_owner = post.user_id === currentUserId;
      });
    } else {
      posts.forEach(post => {
        post.is_liked = false;
        post.is_owner = currentUserId ? post.user_id === currentUserId : false;
      });
    }

    res.json({ posts });
  } catch (err) {
    console.error('Get Posts Error:', err);
    res.status(500).json({ error: 'Failed to fetch posts feed.' });
  }
});

// Create Post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, image_url } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Post content cannot be empty.' });
    }

    const trimmedContent = content.trim();
    const trimmedImage = image_url ? image_url.trim() : '';

    const result = await dbRun(
      'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
      [req.user.id, trimmedContent, trimmedImage]
    );

    // Fetch newly created post with author details
    const newPost = await dbGet(
      `SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        u.full_name,
        u.username,
        u.profile_image,
        0 as like_count,
        0 as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [result.lastID]
    );

    newPost.is_liked = false;
    newPost.is_owner = true;

    res.status(201).json({
      message: 'Post created successfully!',
      post: newPost
    });
  } catch (err) {
    console.error('Create Post Error:', err);
    res.status(500).json({ error: 'Failed to create post.' });
  }
});

// Get Single Post
router.get('/:id', optionalToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);
    const currentUserId = req.user ? req.user.id : null;

    const post = await dbGet(
      `SELECT 
        p.id,
        p.user_id,
        p.content,
        p.image_url,
        p.created_at,
        u.full_name,
        u.username,
        u.profile_image,
        (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (currentUserId) {
      const likeRecord = await dbGet(
        'SELECT * FROM likes WHERE post_id = ? AND user_id = ?',
        [postId, currentUserId]
      );
      post.is_liked = !!likeRecord;
      post.is_owner = post.user_id === currentUserId;
    } else {
      post.is_liked = false;
      post.is_owner = false;
    }

    res.json({ post });
  } catch (err) {
    console.error('Get Post Error:', err);
    res.status(500).json({ error: 'Failed to fetch post.' });
  }
});

// Delete Post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const postId = parseInt(req.params.id, 10);

    const post = await dbGet('SELECT * FROM posts WHERE id = ?', [postId]);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden. You can only delete your own posts.' });
    }

    await dbRun('DELETE FROM posts WHERE id = ?', [postId]);

    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete Post Error:', err);
    res.status(500).json({ error: 'Failed to delete post.' });
  }
});

module.exports = router;
