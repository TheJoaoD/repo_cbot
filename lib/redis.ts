import { createClient } from "redis"

// Criar cliente Redis
const client = createClient({
  url: process.env.REDIS_URL,
})

client.on("error", (err) => console.log("Redis Client Error", err))

// Conectar ao Redis (se ainda não estiver conectado)
if (!client.isOpen) {
  client.connect()
}

export async function getMarketData(key: string) {
  try {
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error fetching from Redis:", error)
    return null
  }
}

export default client
