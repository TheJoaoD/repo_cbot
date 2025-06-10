import { NextResponse } from "next/server"

// Collection of Bible verses
const bibleVerses = [
  {
    verse:
      "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.",
    reference: "João 3:16",
  },
  {
    verse: "Posso todas as coisas naquele que me fortalece.",
    reference: "Filipenses 4:13",
  },
  {
    verse: "O Senhor é o meu pastor, nada me faltará.",
    reference: "Salmos 23:1",
  },
  {
    verse: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
    reference: "Provérbios 3:5",
  },
  {
    verse:
      "Seja forte e corajoso! Não se apavore nem desanime, pois o Senhor, o seu Deus, estará com você por onde você andar.",
    reference: "Josué 1:9",
  },
  {
    verse:
      "Mas os que esperam no Senhor renovam as suas forças. Voam alto como águias; correm e não ficam exaustos, andam e não se cansam.",
    reference: "Isaías 40:31",
  },
  {
    verse:
      "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais.",
    reference: "Jeremias 29:11",
  },
  {
    verse:
      "Não andeis ansiosos de coisa alguma; em tudo, porém, sejam conhecidas, diante de Deus, as vossas petições, pela oração e pela súplica, com ações de graças.",
    reference: "Filipenses 4:6",
  },
]

// Configuração para desabilitar o cache completamente
export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  // Adiciona um timestamp para garantir que cada resposta seja única
  const timestamp = new Date().getTime()

  // Get a random verse from the collection
  const randomIndex = Math.floor(Math.random() * bibleVerses.length)
  const randomVerse = bibleVerses[randomIndex]

  // Return the verse data with no-cache headers
  return new NextResponse(
    JSON.stringify({
      verso: randomVerse.verse,
      referencia: randomVerse.reference,
      timestamp: timestamp, // Adiciona timestamp para garantir resposta única
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  )
}
