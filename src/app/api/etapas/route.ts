import { NextResponse } from 'next/server'
import { getEtapasFromDB } from '@/lib/etapas'

// Public API to load etapas configuration from database
export async function GET() {
  try {
    const etapas = await getEtapasFromDB()
    return NextResponse.json({ etapas })
  } catch {
    return NextResponse.json({ etapas: [] }, { status: 500 })
  }
}
