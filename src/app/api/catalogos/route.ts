// src/app/api/catalogos/route.ts
// GET /api/catalogos — Retorna todos los catálogos para poblar los selects del formulario

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, Catalogos } from '@/types'

export async function GET(): Promise<NextResponse<ApiResponse<Catalogos>>> {
  try {
    const [tiposTela, proveedores, operarios, mesas] = await Promise.all([
      prisma.tipoTela.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.proveedor.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.operario.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      }),
      prisma.mesaCorte.findMany({
        where: { activo: true },
        orderBy: { nombre: 'asc' },
      }),
    ])

    return NextResponse.json({
      data: { tiposTela, proveedores, operarios, mesas },
    })
  } catch (error) {
    console.error('[GET /api/catalogos]', error)
    return NextResponse.json(
      { error: 'Error al obtener los catálogos' },
      { status: 500 }
    )
  }
}
