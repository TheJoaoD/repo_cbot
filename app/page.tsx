"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import Image from "next/image"

interface MarketData {
  symbol: string
  lastPrice: string
  adjustment: string
  change: number
  monthChange: number
  yearChange: number
  volume: number
  contractsTraded: number
  high: string
  low: string
  open: string
  close: string
  lastUpdate: string
  expirationDate: string
  timestamp: string
}

interface CurrencyData {
  symbol: string
  lastPrice: string
  change: string
  percentChange: string
  lastUpdate: string
}

interface ApiResponse {
  error: boolean
  message: string
  soybean: MarketData[]
  corn: MarketData[]
  currency: {
    dollar: CurrencyData | null
    euro: CurrencyData | null
  }
  timestamp: string
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [marketData, setMarketData] = useState<{
    soybean: MarketData[]
    corn: MarketData[]
    currency: {
      dollar: CurrencyData | null
      euro: CurrencyData | null
    }
    lastUpdate: string
  }>({
    soybean: [],
    corn: [],
    currency: {
      dollar: null,
      euro: null,
    },
    lastUpdate: "",
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/v1/market-data")
      const data: ApiResponse = await response.json()

      if (data.error) {
        throw new Error(data.message)
      }

      setMarketData({
        soybean: data.soybean,
        corn: data.corn,
        currency: data.currency,
        lastUpdate: new Date(data.timestamp).toLocaleString("pt-BR"),
      })
    } catch (err) {
      console.error("Error fetching data:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatNumber = (value: number | string, decimals = 2) => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  const formatDate = (dateStr: string) => {
    try {
      const [month, year] = dateStr.split("/")
      return `${month}/${year}`
    } catch {
      return dateStr
    }
  }

  const CurrencyDisplay = () => {
    const { dollar, euro } = marketData.currency

    if (!dollar && !euro) return null

    return (
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 bg-white flex justify-between items-center border-b">
          <h2 className="text-lg font-bold text-[#1B4332]">Câmbio - B3</h2>
          <div className="text-sm text-gray-500">Última atualização: {marketData.lastUpdate}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {dollar && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#1B4332] rounded-full flex items-center justify-center text-white font-bold mr-3">
                  $
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B4332]">USD/BRL</h3>
                  <p className="text-sm text-gray-500">Dólar Comercial</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{formatNumber(dollar.lastPrice, 4)}</div>
                <div
                  className={`flex items-center justify-end text-sm ${Number(dollar.change) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {Number(dollar.change) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{dollar.percentChange}</span>
                </div>
              </div>
            </div>
          )}

          {euro && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#1B4332] rounded-full flex items-center justify-center text-white font-bold mr-3">
                  €
                </div>
                <div>
                  <h3 className="font-semibold text-[#1B4332]">EUR/BRL</h3>
                  <p className="text-sm text-gray-500">Euro Comercial</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{formatNumber(euro.lastPrice, 4)}</div>
                <div
                  className={`flex items-center justify-end text-sm ${Number(euro.change) >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {Number(euro.change) >= 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  <span>{euro.percentChange}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const MarketTable = ({ data, title, isLoading }: { data: MarketData[]; title: string; isLoading: boolean }) => {
    const MESES_PARA_NUMERO: { [key: string]: number } = {
      JAN: 1,
      FEV: 2,
      MAR: 3,
      ABR: 4,
      MAI: 5,
      JUN: 6,
      JUL: 7,
      AGO: 8,
      SET: 9,
      OUT: 10,
      NOV: 11,
      DEZ: 12,
    }

    const sortData = (data: MarketData[]) => {
      return [...data].sort((a, b) => {
        const [monthA, yearA] = a.expirationDate.split("/")
        const [monthB, yearB] = b.expirationDate.split("/")

        const yearDiff = Number.parseInt(yearA) - Number.parseInt(yearB)
        if (yearDiff !== 0) return yearDiff

        const monthNumberA = MESES_PARA_NUMERO[monthA as keyof typeof MESES_PARA_NUMERO]
        const monthNumberB = MESES_PARA_NUMERO[monthB as keyof typeof MESES_PARA_NUMERO]
        return monthNumberA - monthNumberB
      })
    }

    const sortedData = [...data].sort((a, b) => {
      const dateA = new Date(a.timestamp)
      const dateB = new Date(b.timestamp)
      return dateA.getTime() - dateB.getTime()
    })

    return (
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-white flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#1B4332]">{title} - B3 (USD / bushel)</h2>
          <Image
            src="https://gwakkxqrbqiezvrsnzhb.supabase.co/storage/v1/object/public/images_innovagro//WhatsApp_Image_2025-01-09_at_12.00.55-removebg-preview.png"
            alt="Innovagro Logo"
            width={120}
            height={40}
            className="h-8 object-contain"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#1B4332] text-white">
                <th className="px-3 py-2 text-left text-sm font-medium whitespace-nowrap">
                  Data: {new Date().toLocaleDateString("pt-BR")}
                </th>
                {sortedData.map((item) => (
                  <th key={item.expirationDate} className="px-3 py-2 text-center text-sm font-medium whitespace-nowrap">
                    {formatDate(item.expirationDate)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#ECFDF5]">
                <td className="px-3 py-2 text-sm border-b text-[#065F46] font-medium">Último</td>
                {sortedData.map((item, index) => (
                  <td
                    key={`${item.expirationDate}-ultimo`}
                    className="px-3 py-2 text-sm text-center border-b text-[#065F46]"
                  >
                    {formatNumber(item.lastPrice)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Ajuste</td>
                {sortedData.map((item, index) => (
                  <td key={`${item.expirationDate}-ajuste`} className="px-3 py-2 text-sm text-center border-b">
                    {formatNumber(item.adjustment)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Máximo</td>
                {sortedData.map((item, index) => (
                  <td key={`${item.expirationDate}-max`} className="px-3 py-2 text-sm text-center border-b">
                    {formatNumber(item.high)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Mínimo</td>
                {sortedData.map((item, index) => (
                  <td key={`${item.expirationDate}-min`} className="px-3 py-2 text-sm text-center border-b">
                    {formatNumber(item.low)}
                  </td>
                ))}
              </tr>
              <tr className="bg-[#F0FDF4]">
                <td className="px-3 py-2 text-sm border-b text-[#166534] font-medium">Fech. Anterior</td>
                {sortedData.map((item, index) => (
                  <td
                    key={`${item.expirationDate}-close`}
                    className="px-3 py-2 text-sm text-center border-b text-[#166534]"
                  >
                    {formatNumber(item.close)}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Contr. Aberto</td>
                {sortedData.map((item, index) => (
                  <td key={`${item.expirationDate}-volume`} className="px-3 py-2 text-sm text-center border-b">
                    {item.volume.toLocaleString("pt-BR")}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Contr. Negoc.</td>
                {sortedData.map((item, index) => (
                  <td key={`${item.expirationDate}-negoc`} className="px-3 py-2 text-sm text-center border-b">
                    {item.contractsTraded.toLocaleString("pt-BR")}
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Var. Dia</td>
                {sortedData.map((item, index) => (
                  <td
                    key={`${item.expirationDate}-var`}
                    className={`px-3 py-2 text-sm text-center border-b ${
                      item.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.change >= 0 ? "+" : ""}
                    {formatNumber(item.change)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Var. Mês (%)</td>
                {sortedData.map((item, index) => (
                  <td
                    key={`${item.expirationDate}-var-mes`}
                    className={`px-3 py-2 text-sm text-center border-b ${
                      item.monthChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.monthChange >= 0 ? "+" : ""}
                    {formatNumber(item.monthChange)}%
                  </td>
                ))}
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 text-sm border-b text-[#1B4332] font-medium">Var. Ano (%)</td>
                {sortedData.map((item, index) => (
                  <td
                    key={`${item.expirationDate}-var-ano`}
                    className={`px-3 py-2 text-sm text-center border-b ${
                      item.yearChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.yearChange >= 0 ? "+" : ""}
                    {formatNumber(item.yearChange)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-2 text-xs text-gray-500 border-t">
          Fonte: Broadcast | Última Atualização: {marketData.lastUpdate}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="ml-auto">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
            <p className="font-medium">Erro ao carregar dados</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <CurrencyDisplay />

            <MarketTable data={marketData.corn} title="MILHO" isLoading={loading} />
            <MarketTable data={marketData.soybean} title="SOJA" isLoading={loading} />
          </div>
        )}
      </div>
    </main>
  )
}
