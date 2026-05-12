/**
 * data/posts.js
 *
 * This is our in-memory data store.
 * In a real app, this would be a database (MongoDB, PostgreSQL, etc.)
 * For learning purposes, we keep it simple: just a JavaScript array.
 *
 * IMPORTANT DevOps note:
 * Because this is stored in memory (RAM), data is lost when the
 * container restarts. In production, you'd use a persistent volume
 * or external database. We'll address this in a later phase.
 */

let posts = [];

module.exports = posts;
