const { Worker } = require("bullmq");
const redisClient = require("../config/redisConfig");
const supabase = require("../config/supabaseClient");
const { sendMessage } = require("../services/whatService");

const messageWorker = new Worker(
  "messageQueue",
  async (job) => {
    const { messageId } = job.data;

    const { data, error } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (error || !data) {
      console.error("Error fetching message:", error);
      return;
    }

    // Simulate sending message (Replace with Twilio, Email API, etc.)
    console.log(`📩 Sending message to ${data.recipient}: "${data.message}"`);

    const res = await sendMessage(data.session_id, [
      { message: data.message, numbers: data.recipient.split(",") },
    ]);

    if (res.message) {
      await supabase
        .from("scheduled_messages")
        .update({ sent: true })
        .eq("id", messageId);
    } else {
      console.log(
        `Failed to send message ${data.recipient}: "${data.message}"`
      );
    }
  },
  { connection: redisClient }
);

console.log("🚀 Message Worker Started...");
