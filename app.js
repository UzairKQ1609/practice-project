/**
 * app.js — Express Application Entry Point
 *
 * This file:
 * 1. Creates the Express app
 * 2. Registers middleware (functions that run on every request)
 * 3. Mounts routes (URL → handler mappings)
 * 4. Starts the HTTP server
 */

const express = require('express');
const app     = express();

// ── MIDDLEWARE ─────────────────────────────────────────────

/**
 * express.json()
 * Middleware that reads the raw request body and parses it as JSON.
 * Without this, req.body would be undefined when the frontend
 * sends { "content": "my post" } in a POST request.
 */
app.use(express.json());

/**
 * express.static('public')
 * Serves files from the /public directory automatically.
 *
 * How it works:
 *   Request: GET /           → sends public/index.html
 *   Request: GET /style.css  → sends public/style.css
 *   Request: GET /app.js     → sends public/app.js
 *
 * This is how your Express server also acts as a web server.
 * No separate Nginx or Apache needed for this project.
 */
app.use(express.static('public'));

// ── ROUTES ────────────────────────────────────────────────

/**
 * Mount the posts router at /posts.
 * Any request starting with /posts is handled by routes/posts.js.
 *
 *   GET  /posts  → routes/posts.js → router.get('/')
 *   POST /posts  → routes/posts.js → router.post('/')
 */
const postRoutes = require('./routes/posts');
app.use('/posts', postRoutes);

// ── HEALTH CHECK ───────────────────────────────────────────
/**
 * GET /health
 * Returns a simple JSON status response.
 * Used by Docker, load balancers, and CI/CD pipelines
 * to verify the app is alive and responding.
 *
 * You'll use this later when deploying to the cloud.
 */
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime()    // seconds since server started
  });
});

// ── START SERVER ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
/**
 * process.env.PORT
 * We check the environment variable first.
 * Cloud platforms (Railway, Render, AWS) inject their own PORT.
 * Locally, it falls back to 3000.
 * This is called "12-factor app" configuration — a DevOps best practice.
 */

app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`  Local:  http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  API:    http://localhost:${PORT}/posts`);
});
