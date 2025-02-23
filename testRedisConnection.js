const Redis = require("ioredis");

const redisClient = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on("connect", () => {
  console.log("✅ Redis connection established successfully!");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

(async () => {
  try {
    // Set a test key in Redis
    await redisClient.set("test_key", "Hello, Redis!");

    // Retrieve the value
    const value = await redisClient.get("test_key");
    console.log("🔹 Retrieved from Redis:", value);

    // Delete the test key
    await redisClient.del("test_key");

    // Close the connection
    redisClient.quit();
  } catch (error) {
    console.error("❌ Error testing Redis connection:", error);
  }
})();
