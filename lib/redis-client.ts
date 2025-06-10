import { Redis } from "@upstash/redis"

let redisClient: Redis | null = null

function createRedisClient() {
  if (redisClient) return redisClient

  try {
    const url = process.env.REDIS_URL
    const token = process.env.REDIS_PASSWORD

    if (!url || !token) {
      throw new Error("Redis URL or token is missing")
    }

    const formattedUrl = url.startsWith("https://") || url.startsWith("redis://") ? url : `https://${url}`

    redisClient = new Redis({
      url: formattedUrl,
      token,
    })

    return redisClient
  } catch (error) {
    console.error("Redis initialization error:", error)
    return null
  }
}

export async function getContractKeys(symbol: "ZC" | "ZS") {
  const redis = createRedisClient()
  if (!redis) {
    console.error("Redis client not initialized")
    return []
  }

  try {
    const keys = await redis.keys(`cbot:${symbol}*`)
    return keys.sort()
  } catch (error) {
    console.error(`Error fetching keys for ${symbol}:`, error)
    return []
  }
}

export async function getContractsData(keys: string[]) {
  const redis = createRedisClient()
  if (!redis) {
    console.error("Redis client not initialized")
    return []
  }

  if (keys.length === 0) return []

  try {
    const data = await Promise.all(
      keys.map(async (key) => {
        try {
          const result = await redis.get(key)
          if (typeof result === "string") {
            return result
          }
          return JSON.stringify(result)
        } catch (error) {
          console.error(`Error fetching data for key ${key}:`, error)
          return null
        }
      }),
    )
    return data.filter((item) => item !== null)
  } catch (error) {
    console.error("Error fetching contracts data:", error)
    return []
  }
}

const MESES_ABREV = {
  "01": "Jan",
  "02": "Fev",
  "03": "Mar",
  "04": "Abr",
  "05": "Mai",
  "06": "Jun",
  "07": "Jul",
  "08": "Ago",
  "09": "Set",
  "10": "Out",
  "11": "Nov",
  "12": "Dez",
}

const MESES_PARA_NUMERO = {
  Jan: 0,
  Fev: 1,
  Mar: 2,
  Abr: 3,
  Mai: 4,
  Jun: 5,
  Jul: 6,
  Ago: 7,
  Set: 8,
  Out: 9,
  Nov: 10,
  Dez: 11,
}

function stringParaData(mesAno: string): Date {
  const [mesStr, anoStr] = mesAno.split("/")
  const mes = MESES_PARA_NUMERO[mesStr as keyof typeof MESES_PARA_NUMERO]
  const ano = 2000 + Number.parseInt(anoStr, 10)
  return new Date(ano, mes, 1)
}

// Função auxiliar para converter string de data em timestamp
function getDateFromString(dateStr: string): Date {
  const [day, month, year] = dateStr.split("/")

  // Converter ano de 2 dígitos para 4 dígitos
  const fullYear = Number.parseInt(year)
  // Se o ano tem 2 dígitos, converter para 4 dígitos
  // Assumindo que anos 00-49 são 2000-2049 e 50-99 são 1950-1999
  const yearWith4Digits = fullYear < 100 ? (fullYear < 50 ? 2000 + fullYear : 1900 + fullYear) : fullYear

  return new Date(yearWith4Digits, Number.parseInt(month) - 1, Number.parseInt(day))
}

export function parseMarketData(rawData: string | null) {
  if (!rawData) return null

  try {
    const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData
    const firstKey = Object.keys(data)[0]

    if (!firstKey || !data[firstKey]) return null

    const contractData = data[firstKey]

    if (!contractData.symbolId || !Array.isArray(contractData.arrValues)) {
      return null
    }

    const getValue = (code: string) => {
      const item = contractData.arrValues.find((v: any) => Object.keys(v)[0] === code)
      return item ? Object.values(item)[0] : null
    }

    const expirationDate = getValue("09") || "N/A"
    const lastPrice = getValue("10") || "0" // Último
    const adjustment = getValue("0C") || "0" // Ajuste
    const change = getValue("26") || "0" // Var. Dia
    const monthChange = getValue("29") || "0" // Var. Mês
    const yearChange = getValue("2A") || "0" // Var. Ano
    const volume = getValue("1B") || "0" // Contratos Abertos
    const contractsTraded = getValue("1C") || "0" // Contratos Negociados
    const high = getValue("16") || "0"
    const low = getValue("17") || "0"
    const open = getValue("14") || "0"
    const close = getValue("1A") || "0"

    // Converter a data de expiração em um objeto Date
    const date = getDateFromString(expirationDate)

    // Formatar a data no padrão Mês/Ano
    const monthAbbr = MESES_ABREV[`${date.getMonth() + 1}`.padStart(2, "0") as keyof typeof MESES_ABREV]
    const formattedDate = `${monthAbbr}/${date.getFullYear().toString().slice(-2)}`

    return {
      symbol: contractData.symbolId.symbol || "Unknown",
      lastPrice,
      adjustment,
      change,
      monthChange,
      yearChange,
      volume,
      contractsTraded,
      high,
      low,
      open,
      close,
      lastUpdate: contractData.lastUpdate || Date.now(),
      expirationDate: formattedDate,
      timestamp: date.getTime(),
    }
  } catch (error) {
    console.error("Error parsing market data:", error)
    return null
  }
}

// Adicionar uma nova função para buscar as chaves de câmbio
export async function getCurrencyKeys() {
  const redis = createRedisClient()
  if (!redis) {
    console.error("Redis client not initialized")
    return []
  }

  try {
    // Buscar chaves para dólar e euro
    const keys = await redis.keys("*DOL COM*")
    const euroKeys = await redis.keys("*EUROCOM*")
    return [...keys, ...euroKeys].sort()
  } catch (error) {
    console.error(`Error fetching currency keys:`, error)
    return []
  }
}

// Adicionar uma função para processar dados de câmbio
export function parseCurrencyData(rawData: string | null) {
  if (!rawData) return null

  try {
    const data = typeof rawData === "string" ? JSON.parse(rawData) : rawData
    const firstKey = Object.keys(data)[0]

    if (!firstKey || !data[firstKey]) return null

    const currencyData = data[firstKey]

    if (!currencyData.symbolId || !Array.isArray(currencyData.arrValues)) {
      return null
    }

    const getValue = (code: string) => {
      const item = currencyData.arrValues.find((v: any) => Object.keys(v)[0] === code)
      return item ? Object.values(item)[0] : null
    }

    const lastPrice = getValue("10") || "0" // Último
    const change = getValue("26") || "0" // Var. Dia
    const percentChange = getValue("01") || "0" // Var. Dia %

    return {
      symbol: currencyData.symbolId.symbol || "Unknown",
      lastPrice: lastPrice.toString().replace("S", ""),
      change,
      percentChange,
      lastUpdate: currencyData.lastUpdate || Date.now(),
    }
  } catch (error) {
    console.error("Error parsing currency data:", error)
    return null
  }
}
