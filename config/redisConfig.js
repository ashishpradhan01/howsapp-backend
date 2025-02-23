const Redis = require("ioredis");
const fs = require("fs");

const REDIS_URL = process.env.REDIS_URL_FILE
  ? fs.readFileSync(process.env.REDIS_URL_FILE, "utf8").trim()
  : process.env.REDIS_URL;

const redisClient = new Redis({
  host: REDIS_URL || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

module.exports = redisClient;
