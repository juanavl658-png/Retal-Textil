// src/app/api/health/route.ts
// GET /api/health — Verifica que la app y la base de datos están funcionando

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    // Ping a la base de datos
    await prisma.$queryRaw`SELECT 1`

    const [totalCortes, totalTelas] = await Promise.all([
      prisma.corte.count(),
      prisma.tipoTela.count(),
    ])

    return NextResponse.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      version:   process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      database:  'connected',
      stats: {
        totalCortes,
        totalTelas,
      },
    })
  } catch (error) {
    console.error('[GET /api/health]', error)
    return NextResponse.json(
      {
        status:    'error',
        timestamp: new Date().toISOString(),
        database:  'disconnected',
        error:     'No se puede conectar a la base de datos',
      },
      { status: 503 }
    )
  }
}
export const dynamic = 'force-dynamic'
