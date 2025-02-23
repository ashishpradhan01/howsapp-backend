const { Queue } = require("bullmq");
const redisClient = require("../config/redisConfig");

const messageQueue = new Queue("messageQueue", { connection: redisClient });

async function addToQueue(messages) {
  for (const message of messages) {
    const delay = new Date(message.send_at).getTime() - Date.now();
    if (delay > 0) {
      await messageQueue.add(
        "sendMessage",
        { messageId: message.id },
        { delay }
      );
      console.log(`Message scheduled for ${message.send_at}`);
    } else {
      console.log(`Skipping past message: ${message.id}`);
    }
  }
}

module.exports = { messageQueue, addToQueue };
