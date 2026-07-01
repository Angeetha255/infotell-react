/**
 * In-memory token store for email verification magic links.
 *
 * In production you would replace this with a database (MongoDB, Redis, etc.).
 * Each entry:
 *   key   : SHA-256 hex hash of the raw token
 *   value : { email, expiresAt (ms), used (bool), returnUrl }
 */

const store = new Map();

// Purge expired entries every 5 minutes to keep memory clean
setInterval(() => {
  const now = Date.now();
  for (const [hash, entry] of store.entries()) {
    if (entry.expiresAt < now) {
      store.delete(hash);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  /**
   * Save a hashed token.
   * @param {string} hash        - SHA-256 hex of the raw token
   * @param {string} email       - User's email address
   * @param {number} expiresAt   - Unix ms timestamp when the token expires
   * @param {string} returnUrl   - The review page URL to redirect back to
   */
  save(hash, email, expiresAt, returnUrl) {
    store.set(hash, { email, expiresAt, used: false, returnUrl });
  },

  /**
   * Look up a hashed token. Returns the entry or null.
   * @param {string} hash
   * @returns {{ email: string, expiresAt: number, used: boolean, returnUrl: string } | null}
   */
  get(hash) {
    return store.get(hash) || null;
  },

  /**
   * Mark a token as used so it cannot be replayed.
   * @param {string} hash
   */
  consume(hash) {
    const entry = store.get(hash);
    if (entry) {
      entry.used = true;
      store.set(hash, entry);
    }
  },

  /**
   * Remove a token from the store entirely.
   * @param {string} hash
   */
  remove(hash) {
    store.delete(hash);
  },
};
