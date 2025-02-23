const fs = require("fs");
const { SESSION_PATH } = require("../constants");

/**
 * Generates a unique session ID.
 * The session ID is composed of the current timestamp and a random alphanumeric string.
 *
 * @returns {string} - A unique session ID string.
 */
const generateSessionId = () => {
  // Create a session ID that includes the current timestamp and a random alphanumeric string
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Checks if a session directory exists for the given session ID.
 *
 * @param {string} sessionId - The session ID to check for existence.
 * @returns {boolean} - Returns true if the session exists, otherwise false.
 */
const doesSessionExist = (sessionId) => {
  // Check if the directory corresponding to the session ID exists at the specified path
  return fs.existsSync(`${SESSION_PATH}/${sessionId}`);
};

const mkdirSync = (sessionPath) => {
  fs.mkdirSync(sessionPath, { recursive: true });
};

module.exports = { generateSessionId, doesSessionExist, mkdirSync };
