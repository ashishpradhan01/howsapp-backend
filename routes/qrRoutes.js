const express = require("express");
const {
  generateAndEmitQRCode,
  waitQRCodeOnPage,
} = require("../services/whatService");

const router = express.Router();

router.get("/code", async (req, res) => {
  const reqSessionId = req.query.sid;
  if (!reqSessionId) {
    return res
      .status(400)
      .json({ message: "No 'sid' parameter found in query." });
  }
  console.log(`Session ID: ${reqSessionId}`);

  const qrCodeData = await generateAndEmitQRCode(reqSessionId);
  console.log({ qrcode: qrCodeData });
  res.json({ qrcode: qrCodeData }).end();
});

router.get("/scan", async (req, res) => {
  const reqSessionId = req.query.sid;
  if (!reqSessionId) {
    return res
      .status(400)
      .json({ message: "No 'sid' parameter found in query." });
  }
  console.log(`Session ID: ${reqSessionId}`);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Immediately send an initial event to the client
  res.write(
    `data: ${JSON.stringify({ message: "Waiting for user to scan QR" })}\n\n`
  );

  try {
    const { browser, page, qrData } = await generateAndEmitQRCode(reqSessionId);
    res.write(`data: ${JSON.stringify({ code: qrData, type: "QRCODE" })}\n\n`);

    try {
      await waitQRCodeOnPage(browser, page);
      console.log("Success on waitQRCode");
      res.write(`data: ${JSON.stringify({ scan: true, type: "QRSCAN" })}\n\n`);
    } catch (error) {
      console.error("Error on waitQRCode:", error);
      res.write(`data: ${JSON.stringify({ scan: false, type: "QRSCAN" })}\n\n`);
    }
  } catch (error) {
    console.error("Error on generateAndEmitQRCode:", error);
    res.write(`data: ${JSON.stringify({ code: null, type: "QRCODE" })}\n\n`);
  }

  //  finally {
  //   // Close connection after sending result
  //   res.end();
  // }

  // Handle client disconnect
  req.on("close", () => {
    console.log(`Client disconnected from session ${reqSessionId}`);
    res.end();
  });
});

module.exports = router;
