import { NextResponse } from "next/server"
import { getCounter } from "@/lib/counter"

export async function GET() {
  return NextResponse.json({
    count: getCounter(),
  })
}
