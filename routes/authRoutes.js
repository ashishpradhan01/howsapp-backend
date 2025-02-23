const express = require("express");
const {
  checkAuthentication,
  initializeNewWhatsWebSession,
} = require("../services/whatService");

const router = express.Router();

router.get("/start-session", async (req, res) => {
  try {
    /**
     * Calls startNewSession:
     * - If `sessionId` is not present in Client's localStorage, a new session is created and returned.
     */
    const { sessionId: newSessionId } = await initializeNewWhatsWebSession(
      true
    );

    // Respond with the session ID
    res.json({ sessionId: newSessionId });
  } catch (error) {
    console.error("Error starting WhatsApp session:", error);

    // Return a 500 status with an error message if something goes wrong
    res.status(500).json({ error: "Failed to start WhatsApp session" });
  }
});

router.get("/auth", async (req, res) => {
  const reqSessionId = req.query.sid;
  if (!reqSessionId) {
    return res
      .status(400)
      .json({ message: "No 'sid' parameter found in query." });
  }
  console.log(`Session ID: ${reqSessionId}`);
  let isAuthenticate = await checkAuthentication(reqSessionId);
  res.json(isAuthenticate).end();
});

module.exports = router;
