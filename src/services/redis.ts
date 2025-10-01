import Redis from "ioredis";

class RedisService {
  private static instance: Redis | null;

  static init() {
    RedisService.instance = new Redis(process.env.REDIS_URL as string);

    RedisService.instance.on("error", (err) => {
      console.error("Redis error:", err);
    });

    RedisService.instance.on("connect", () => {
      console.log("Redis connected");
    });
  }

  static getInstance() {
    if (!RedisService.instance) {
      RedisService.init();
    }
    return RedisService.instance as Redis;
  }

  static disconnect() {
    if (RedisService.instance) {
      RedisService.instance.quit();
      RedisService.instance = null;
    }
  }
}

export default RedisService;
