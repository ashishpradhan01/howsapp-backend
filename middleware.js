const { decrypt } = require("./utils/cryptoUtility");

const decryptQuerySessionId = (req, res, next) => {
  try {
    // Check if 'sid' exists in query parameters before attempting decryption
    if (req.query["sid"]) {
      req.query["sid"] = decrypt(req.query["sid"]);
    }
  } catch (error) {
    // Log error and provide some context for easier debugging
    console.error(`Error decrypting query param 'sid': `, error);
    return res.status(400).json({ message: "Failed to decrypt session ID" }); // Send a response in case of error
  }
  next();
};

module.exports = { decryptQuerySessionId };
