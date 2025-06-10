import { NextResponse } from "next/server"
import { ImageResponse } from "@vercel/og"
import {
  getContractKeys,
  getContractsData,
  parseMarketData,
  getCurrencyKeys,
  parseCurrencyData,
} from "@/lib/redis-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

const imageOptions = {
  width: 2048,
  height: undefined,
  emoji: "twemoji",
  debug: false,
}

export async function GET() {
  try {
    // Buscar chaves de câmbio
    const currencyKeys = await getCurrencyKeys()
    const currencyData = await getContractsData(currencyKeys)
    const parsedCurrencyData = currencyData
      .map((data) => parseCurrencyData(data))
      .filter((data): data is NonNullable<typeof data> => data !== null)

    // Separar dados de dólar e euro
    const dollarData = parsedCurrencyData.find((data) => data.symbol.includes("DOL"))
    const euroData = parsedCurrencyData.find((data) => data.symbol.includes("EURO"))

    // Buscar e processar dados em paralelo
    const [[soybeanKeys, cornKeys], soybeanImage, cornImage] = await Promise.all([
      Promise.all([getContractKeys("ZS"), getContractKeys("ZC")]),
      generateMarketTable("ZS", "SOJA", dollarData, euroData),
      generateMarketTable("ZC", "MILHO", dollarData, euroData),
    ])

    // Nova estrutura da resposta
    return NextResponse.json(
      {
        tabelas: {
          base64_soja: soybeanImage,
          base64_milho: cornImage,
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    )
  } catch (error) {
    console.error("Error generating market data tables:", error)
    return NextResponse.json(
      {
        error: true,
        message: error instanceof Error ? error.message : "Unknown error occurred",
        details: JSON.stringify(error),
      },
      { status: 500 },
    )
  }
}

async function generateMarketTable(symbol: "ZS" | "ZC", title: string, dollarData: any, euroData: any) {
  try {
    // Buscar dados
    const keys = await getContractKeys(symbol)
    const rawData = await getContractsData(keys)

    // Processar dados
    const parsedData = rawData
      .map((data) => parseMarketData(data))
      .filter((data): data is NonNullable<typeof data> => data !== null)
      .sort((a, b) => a.timestamp - b.timestamp)

    // Gerar imagem
    const image = await new ImageResponse(generateTableStructure(parsedData, title, dollarData, euroData), imageOptions)

    // Converter para base64
    return Buffer.from(await image.arrayBuffer()).toString("base64")
  } catch (error) {
    console.error(`Error generating ${title} table:`, error)
    return ""
  }
}

// Função para formatar data no fuso horário GMT-3 (Brasília)
function formatDateBRT(date: Date): string {
  // Ajustar para GMT-3 (Brasília)
  const brazilTime = new Date(date.getTime() - 3 * 60 * 60 * 1000)

  // Formatar a data no padrão brasileiro
  return brazilTime.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "UTC",
  })
}

function generateTableStructure(data: any[], title: string, dollarData: any, euroData: any) {
  // Função para formatar números com 4 casas decimais para câmbio
  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? Number.parseFloat(value) : value
    return num.toLocaleString("pt-BR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })
  }

  // Remover duplicatas mantendo a ordem
  const uniqueData = data.reduce((acc: any[], current) => {
    const exists = acc.find((item) => item.timestamp === current.timestamp)
    if (!exists) acc.push(current)
    return acc
  }, [])

  const rows = [
    {
      label: "Último",
      key: "lastPrice",
      transform: (v: string) => v.replace("S", ""), // Remove 'S' suffix
      bgColor: "#ECFDF5", // Verde claro
      textColor: "#065F46", // Verde escuro
    },
    {
      label: "Ajuste",
      key: "adjustment",
      bgColor: "#f8fafc", // Cinza claro
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Máximo",
      key: "high",
      bgColor: "#ffffff", // Branco
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Mínimo",
      key: "low",
      bgColor: "#f8fafc", // Cinza claro
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Abertura",
      key: "open",
      bgColor: "#ffffff", // Branco
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Fech. Anterior",
      key: "close",
      bgColor: "#F0FDF4", // Verde muito claro
      textColor: "#166534", // Verde médio
    },
    {
      label: "Contr. Aberto",
      key: "volume",
      bgColor: "#f8fafc", // Cinza claro
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Contr. Negoc.",
      key: "contractsTraded",
      bgColor: "#ffffff", // Branco
      textColor: "#1B4332", // Verde escuro
    },
    {
      label: "Var. Dia",
      key: "change",
      color: (v: string) => (Number(v) >= 0 ? "#16a34a" : "#dc2626"), // Verde/Vermelho
      bgColor: "#f8fafc", // Cinza claro
    },
    {
      label: "Var. Mês (%)",
      key: "monthChange",
      color: (item: any) => (Number(item.monthChange) >= 0 ? "#16a34a" : "#dc2626"),
      value: (item: any) => {
        const value = Number(item.monthChange)
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
      },
      bgColor: "#ffffff", // Branco
    },
    {
      label: "Var. Ano (%)",
      key: "yearChange",
      color: (item: any) => (Number(item.yearChange) >= 0 ? "#16a34a" : "#dc2626"),
      value: (item: any) => {
        const value = Number(item.yearChange)
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
      },
      bgColor: "#f8fafc", // Cinza claro
    },
  ]

  // Obter a data atual no fuso horário de Brasília (GMT-3)
  const currentDate = new Date()
  const formattedDate = formatDateBRT(currentDate)

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        backgroundColor: "#f8fafc", // Fundo cinza muito claro
        padding: 40,
      },
      children: [
        // Seção de câmbio
        {
          type: "div",
          props: {
            style: {
              backgroundColor: "#ffffff",
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            },
            children: [
              // Header do câmbio
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: 16,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#1B4332",
                          fontSize: 24,
                          fontWeight: "700",
                        },
                        children: "Câmbio - B3",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#6b7280",
                          fontSize: 16,
                        },
                        children: `Última atualização: ${formattedDate}`,
                      },
                    },
                  ],
                },
              },
              // Dados de câmbio
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    gap: 24,
                  },
                  children: [
                    // Dólar
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 20px",
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          flex: 1,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      width: 40,
                                      height: 40,
                                      backgroundColor: "#1B4332",
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      fontWeight: "700",
                                      fontSize: 18,
                                      marginRight: 12,
                                    },
                                    children: "$",
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    children: [
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            fontWeight: "600",
                                            color: "#1B4332",
                                            fontSize: 18,
                                          },
                                          children: "USD/BRL",
                                        },
                                      },
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            fontSize: 14,
                                            color: "#6b7280",
                                          },
                                          children: "Dólar Comercial",
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                textAlign: "right",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 24,
                                      fontWeight: "700",
                                      color: "#1B4332",
                                    },
                                    children: dollarData ? formatCurrency(dollarData.lastPrice) : "N/A",
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 16,
                                      color: dollarData && Number(dollarData.change) >= 0 ? "#16a34a" : "#dc2626",
                                      fontWeight: "500",
                                    },
                                    children: dollarData ? dollarData.percentChange : "",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    // Euro
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 20px",
                          backgroundColor: "#f8fafc",
                          borderRadius: 8,
                          flex: 1,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                alignItems: "center",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      width: 40,
                                      height: 40,
                                      backgroundColor: "#1B4332",
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      color: "#ffffff",
                                      fontWeight: "700",
                                      fontSize: 18,
                                      marginRight: 12,
                                    },
                                    children: "€",
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    children: [
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            fontWeight: "600",
                                            color: "#1B4332",
                                            fontSize: 18,
                                          },
                                          children: "EUR/BRL",
                                        },
                                      },
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            fontSize: 14,
                                            color: "#6b7280",
                                          },
                                          children: "Euro Comercial",
                                        },
                                      },
                                    ],
                                  },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                textAlign: "right",
                              },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 24,
                                      fontWeight: "700",
                                      color: "#1B4332",
                                    },
                                    children: euroData ? formatCurrency(euroData.lastPrice) : "N/A",
                                  },
                                },
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: 16,
                                      color: euroData && Number(euroData.change) >= 0 ? "#16a34a" : "#dc2626",
                                      fontWeight: "500",
                                    },
                                    children: euroData ? euroData.percentChange : "",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Tabela principal
        {
          type: "div",
          props: {
            style: {
              backgroundColor: "#ffffff",
              borderRadius: 8,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            },
            children: [
              // Header da tabela
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 24px",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e5e7eb",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#1B4332",
                          fontSize: 24,
                          fontWeight: "700",
                        },
                        children: `${title} - CBOT (USD / bushel)`,
                      },
                    },
                    {
                      type: "img",
                      props: {
                        src: "https://gwakkxqrbqiezvrsnzhb.supabase.co/storage/v1/object/public/images_innovagro//f2d1ae35-b222-47c4-af8c-c70811e249f9.png",
                        width: 160,
                        height: 54,
                        style: {
                          objectFit: "contain",
                        },
                      },
                    },
                  ],
                },
              },
              // Tabela de dados
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                  },
                  children: [
                    // Cabeçalho da tabela
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          backgroundColor: "#1B4332",
                          width: "100%",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                flex: "0 0 180px",
                                padding: "12px 16px",
                                color: "#ffffff",
                                textAlign: "left",
                                fontSize: 16,
                                fontWeight: "600",
                              },
                              children: `Data: ${formatDateBRT(new Date()).split(" ")[0]}`,
                            },
                          },
                          ...uniqueData.map((item) => ({
                            type: "div",
                            props: {
                              style: {
                                flex: 1,
                                padding: "12px 16px",
                                color: "#ffffff",
                                textAlign: "center",
                                fontSize: 16,
                                fontWeight: "600",
                              },
                              children: item.expirationDate,
                            },
                          })),
                        ],
                      },
                    },
                    // Linhas de dados
                    ...rows.map((row, rowIndex) => ({
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          width: "100%",
                          backgroundColor: row.bgColor || "#ffffff",
                          borderBottom: rowIndex === rows.length - 1 ? "none" : "1px solid #e5e7eb",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                flex: "0 0 180px",
                                padding: "12px 16px",
                                color: row.textColor || "#1B4332",
                                fontWeight: "500",
                                fontSize: 16,
                              },
                              children: row.label,
                            },
                          },
                          ...uniqueData.map((item) => {
                            const value = row.value
                              ? row.value(item)
                              : row.transform
                                ? row.transform(item[row.key])
                                : item[row.key]

                            const color = row.color
                              ? typeof row.color === "function"
                                ? row.color(item)
                                : row.color
                              : row.textColor || "#1B4332"

                            return {
                              type: "div",
                              props: {
                                style: {
                                  flex: 1,
                                  padding: "12px 16px",
                                  textAlign: "center",
                                  fontSize: 16,
                                  fontWeight: "500",
                                  color,
                                  fontFamily: "monospace",
                                },
                                children: value,
                              },
                            }
                          }),
                        ],
                      },
                    })),
                  ],
                },
              },
              // Footer
              {
                type: "div",
                props: {
                  style: {
                    padding: "12px 16px",
                    fontSize: 14,
                    color: "#6b7280",
                    borderTop: "1px solid #e5e7eb",
                    backgroundColor: "#f8fafc",
                  },
                  children: `Fonte: Broadcast | Última Atualização: ${formattedDate} (GMT-3)`,
                },
              },
            ],
          },
        },
      ],
    },
  }
}
