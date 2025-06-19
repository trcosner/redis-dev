import { createClient, type RedisClientType} from "redis"

let client: RedisClientType | null = null

export async function initializeRedisClient() {
 if(!client){
    client = createClient({
      url: `redis://:${process.env.REDIS_PASSWORD}@redis:6379`
    })
    client.on("error", (err) => console.log("Redis Client Error", err))
    client.on("connect", () => console.log("Redis Client Connected"))
    await client.connect()
  }
  return client
}