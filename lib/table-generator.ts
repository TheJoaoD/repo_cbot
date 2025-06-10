import puppeteer from "puppeteer"

interface MarketData {
  symbol: string
  lastPrice: string
  change: number
  volume: number
  high: string
  low: string
  open: string
  close: string
  lastUpdate: string
  expirationDate: string
}

export async function generateTableImage(data: MarketData[], title: string) {
  const browser = await puppeteer.launch({
    headless: "new",
  })

  const page = await browser.newPage()

  const html = `
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: white;
          }
          
          .market-table {
            width: 100%;
            border-collapse: collapse;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          }
          
          .market-table th {
            background: #1a365d;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 14px;
          }
          
          .market-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }
          
          .market-table tr:nth-child(even) {
            background: #f8fafc;
          }
          
          .positive {
            color: #059669;
          }
          
          .negative {
            color: #dc2626;
          }
          
          .title {
            font-size: 24px;
            color: #1a365d;
            margin-bottom: 16px;
            font-weight: bold;
          }

          .timestamp {
            color: #64748b;
            font-size: 12px;
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="title">${title}</div>
        <div class="timestamp">Última atualização: ${new Date().toLocaleString()}</div>
        <table class="market-table">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Último</th>
              <th>Var.</th>
              <th>Volume</th>
              <th>Máx</th>
              <th>Mín</th>
              <th>Abert.</th>
              <th>Fech.</th>
              <th>Vencimento</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (row) => `
              <tr>
                <td>${row.symbol}</td>
                <td>${row.lastPrice}</td>
                <td class="${row.change >= 0 ? "positive" : "negative"}">
                  ${row.change >= 0 ? "+" : ""}${row.change.toFixed(2)}
                </td>
                <td>${row.volume.toLocaleString()}</td>
                <td>${row.high}</td>
                <td>${row.low}</td>
                <td>${row.open}</td>
                <td>${row.close}</td>
                <td>${row.expirationDate}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>
  `

  await page.setContent(html)

  const element = await page.$("body")
  const image = await element?.screenshot({
    encoding: "base64",
  })

  await browser.close()

  return image
}
