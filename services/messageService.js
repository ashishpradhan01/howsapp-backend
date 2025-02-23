const supabase = require("../config/supabaseClient");
const { addToQueue } = require("../queues/messageQueue");

async function scheduleMultipleMessages(sessionId, messages) {
  const { data, error } = await supabase
    .from("scheduled_messages")
    .insert(
      messages.map((msg) => ({
        session_id: sessionId,
        message: msg.message,
        send_at: msg.sendAt,
        recipient: msg.recipient,
        sent: false,
      }))
    )
    .select();

  if (error) {
    console.error("Error saving scheduled messages:", error);
    return { success: false, error };
  }

  console.log("Messages scheduled:", data);
  await addToQueue(data);

  return { success: true, data };
}

module.exports = { scheduleMultipleMessages };
