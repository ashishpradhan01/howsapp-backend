const express = require("express");
const {
  scheduleMessage,
  scheduleMultipleMessages,
} = require("../services/messageService");
const { generateDateList } = require("../utils/generateDateList");
const { sendMessage } = require("../services/whatService");

const router = express.Router();

router.post("/", async (req, res) => {
  const reqSessionId = req.query.sid;
  if (!reqSessionId) {
    return res
      .status(400)
      .json({ message: "No 'sid' parameter found in query." });
  }
  if (!req.body) {
    return res
      .status(400)
      .json({ message: "Message and Phone Number are required." });
  }
  const resSend = await sendMessage(reqSessionId, req.body);

  return res.status(200).json(resSend);
});

router.post("/schedule", async (req, res) => {
  const reqSessionId = req.query.sid;
  const messages = req.body;

  if (!reqSessionId || !Array.isArray(messages) || messages.length === 0) {
    console.log({ reqSessionId, messages });
    return res.status(400).json({ error: "Invalid request format" });
  }

  const messageRequest = messages.flatMap((message) => {
    const dateTimes = generateDateList(
      message.startDate,
      message.endDate,
      message.time
    );
    return dateTimes.map((dateTime) => ({
      sendAt: dateTime,
      recipient: message.numbers.join(","),
      message: message.message,
    }));
  });

  console.log({ messageRequest });

  const result = await scheduleMultipleMessages(reqSessionId, messageRequest);

  if (result.success) {
    res
      .status(201)
      .json({ message: "Messages scheduled successfully", data: result.data });
  } else {
    res
      .status(500)
      .json({ error: "Failed to schedule messages", details: result.error });
  }
});

module.exports = router;
