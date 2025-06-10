import { NextResponse } from "next/server"
import {
  getContractKeys,
  getContractsData,
  parseMarketData,
  getCurrencyKeys,
  parseCurrencyData,
} from "@/lib/redis-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    if (!process.env.REDIS_URL || !process.env.REDIS_PASSWORD) {
      console.error("Redis environment variables missing")
      return new NextResponse(
        JSON.stringify({
          error: true,
          message: "Redis configuration is missing",
          soybean: [],
          corn: [],
          currency: {
            dollar: null,
            euro: null,
          },
          timestamp: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
    }

    console.log("Fetching market data...")

    // Buscar chaves dos contratos e câmbio
    const [soybeanKeys, cornKeys, currencyKeys] = await Promise.all([
      getContractKeys("ZS"),
      getContractKeys("ZC"),
      getCurrencyKeys(),
    ])

    console.log(
      `Found keys - Soybean: ${soybeanKeys.length}, Corn: ${cornKeys.length}, Currency: ${currencyKeys.length}`,
    )

    // Buscar dados dos contratos e câmbio
    const [soybeanData, cornData, currencyData] = await Promise.all([
      getContractsData(soybeanKeys),
      getContractsData(cornKeys),
      getContractsData(currencyKeys),
    ])

    console.log(
      `Raw data fetched - Soybean: ${soybeanData.length}, Corn: ${cornData.length}, Currency: ${currencyData.length}`,
    )

    // Log dos dados brutos para debug
    console.log("Sample soybean data:", soybeanData[0]?.substring(0, 100))
    console.log("Sample corn data:", cornData[0]?.substring(0, 100))
    console.log("Sample currency data:", currencyData[0]?.substring(0, 100))

    // Processar dados
    const parsedSoybeanData = soybeanData
      .map((data) => parseMarketData(data))
      .filter((data): data is NonNullable<typeof data> => data !== null)

    const parsedCornData = cornData
      .map((data) => parseMarketData(data))
      .filter((data): data is NonNullable<typeof data> => data !== null)

    const parsedCurrencyData = currencyData
      .map((data) => parseCurrencyData(data))
      .filter((data): data is NonNullable<typeof data> => data !== null)

    // Separar dados de dólar e euro
    const dollarData = parsedCurrencyData.find((data) => data.symbol.includes("DOL"))
    const euroData = parsedCurrencyData.find((data) => data.symbol.includes("EURO"))

    console.log(
      `Processed data - Soybean: ${parsedSoybeanData.length}, Corn: ${parsedCornData.length}, Currency: ${parsedCurrencyData.length}`,
    )

    // Retornar dados processados
    const response = {
      error: false,
      message: "Success",
      soybean: parsedSoybeanData,
      corn: parsedCornData,
      currency: {
        dollar: dollarData,
        euro: euroData,
      },
      timestamp: new Date().toISOString(),
    }

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error in market data route:", error)
    return new NextResponse(
      JSON.stringify({
        error: true,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        soybean: [],
        corn: [],
        currency: {
          dollar: null,
          euro: null,
        },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}
