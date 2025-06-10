import { NextResponse } from "next/server"
import { incrementCounter } from "@/lib/counter"

// Collection of Bible verses
const bibleVerses = [
  {
    text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
    reference: "John 3:16",
    translation: "NIV",
  },
  {
    text: "I can do all this through him who gives me strength.",
    reference: "Philippians 4:13",
    translation: "NIV",
  },
  {
    text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
    reference: "Proverbs 3:5-6",
    translation: "NIV",
  },
  {
    text: "The LORD is my shepherd, I lack nothing.",
    reference: "Psalm 23:1",
    translation: "NIV",
  },
  {
    text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.",
    reference: "Joshua 1:9",
    translation: "NIV",
  },
  {
    text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.",
    reference: "Isaiah 40:31",
    translation: "NIV",
  },
  {
    text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.",
    reference: "Jeremiah 29:11",
    translation: "NIV",
  },
  {
    text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.",
    reference: "Romans 8:28",
    translation: "NIV",
  },
  {
    text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.",
    reference: "Philippians 4:6",
    translation: "NIV",
  },
  {
    text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you; the LORD turn his face toward you and give you peace.",
    reference: "Numbers 6:24-26",
    translation: "NIV",
  },
  {
    text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.",
    reference: "1 Corinthians 13:4",
    translation: "NIV",
  },
  {
    text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.",
    reference: "Galatians 5:22-23",
    translation: "NIV",
  },
  {
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
    translation: "NIV",
  },
  {
    text: "The name of the LORD is a fortified tower; the righteous run to it and are safe.",
    reference: "Proverbs 18:10",
    translation: "NIV",
  },
  {
    text: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you.",
    reference: "Ephesians 4:32",
    translation: "NIV",
  },
]

export async function GET() {
  // Increment the request counter
  const count = incrementCounter()

  // Get a random verse from the collection
  const randomIndex = Math.floor(Math.random() * bibleVerses.length)
  const randomVerse = bibleVerses[randomIndex]

  // Configurar CORS para permitir acesso externo
  return new NextResponse(
    JSON.stringify({
      versiculo: randomVerse.text,
      referencia: randomVerse.reference,
      traducao: randomVerse.translation,
      requestCount: count,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Permite acesso de qualquer origem
        "Access-Control-Allow-Methods": "GET", // Permite apenas método GET
      },
    },
  )
}
