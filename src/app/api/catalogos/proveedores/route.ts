// src/app/api/catalogos/proveedores/route.ts
// GET /api/catalogos/proveedores — Lista proveedores
// POST /api/catalogos/proveedores — Crea un proveedor nuevo

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

export async function GET(): Promise<NextResponse> {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombre: 'asc' },
    })
    return NextResponse.json({ data: proveedores })
  } catch (error) {
    console.error('[GET /api/catalogos/proveedores]', error)
    return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await req.json()
    const { nombre } = body

    if (!nombre || typeof nombre !== 'string' || nombre.trim().length === 0) {
      return NextResponse.json({ error: 'El nombre del proveedor es requerido' }, { status: 400 })
    }

    const proveedor = await prisma.proveedor.create({
      data: { nombre: nombre.trim() },
    })

    return NextResponse.json({ data: proveedor, message: 'Proveedor creado exitosamente' }, { status: 201 })
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Ya existe un proveedor con ese nombre' }, { status: 409 })
    }
    console.error('[POST /api/catalogos/proveedores]', error)
    return NextResponse.json({ error: 'Error al crear el proveedor' }, { status: 500 })
  }
}
