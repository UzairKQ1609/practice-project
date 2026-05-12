/**
 * routes/posts.js
 *
 * This file defines the API endpoints for posts.
 * Express Router lets us group related routes together
 * and attach them to a URL prefix in app.js.
 *
 * Our API:
 *   GET    /posts       → return all posts as JSON
 *   POST   /posts       → create a new post
 *   DELETE /posts       → clear all posts
 */

const express = require('express');
const router  = express.Router();

// Import our in-memory data store
// Note: In Node.js, arrays/objects are passed by reference,
// so mutations here affect the same array in memory.
let posts = require('../data/posts');

// ── GET /posts ─────────────────────────────────────────────
// Returns all posts as a JSON array.
// The frontend calls this on page load to populate the feed.
router.get('/', (req, res) => {
  res.json(posts);
});

// ── POST /posts ────────────────────────────────────────────
// Creates a new post.
// The frontend sends: { "content": "my post text" }
// We add a timestamp and push it to our array.
router.post('/', (req, res) => {
  const { content } = req.body;

  // Server-side validation — always validate on the server,
  // even if the frontend already validates. Never trust the client.
  if (!content || typeof content !== 'string') {
    return res.status(400).json({
      error: 'Post content is required and must be a string.'
    });
  }

  const trimmed = content.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Post cannot be empty.' });
  }

  if (trimmed.length > 280) {
    return res.status(400).json({ error: 'Post exceeds 280 characters.' });
  }

  // Build the post object with a timestamp
  const newPost = {
    content:   trimmed,
    timestamp: new Date().toISOString()   // e.g. "2024-01-15T10:30:00.000Z"
  };

  // Add to our in-memory array
  posts.push(newPost);

  // Respond with the created post AND the full updated list
  // HTTP 201 = "Created" (more accurate than 200 for POST)
  res.status(201).json({
    message: 'Post created successfully',
    post:    newPost,
    posts:   posts
  });
});

// ── DELETE /posts ──────────────────────────────────────────
// Clears all posts.
// We use splice() to empty the array in place,
// so the reference in data/posts.js stays the same.
router.delete('/', (req, res) => {
  posts.splice(0, posts.length);   // Empty the array (in-place mutation)

  res.json({
    message: 'All posts cleared',
    posts:   posts
  });
});

module.exports = router;
