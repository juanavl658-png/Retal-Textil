// src/app/api/cortes/[id]/route.ts
// GET    /api/cortes/:id — Obtiene un corte por ID
// PUT    /api/cortes/:id — Actualiza un corte (recalcula indicadores)
// DELETE /api/cortes/:id — Elimina un corte

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularTodo, gramajePromedio } from '@/lib/calculos'
import { DEPARTAMENTO_HABILITADO } from '@/lib/constantes'
import type { ApiResponse } from '@/types'

const INCLUDE_RELACIONES = {
  mesaCorte: true,
  operario:  true,
  tipoTela:  true,
  proveedor: true,
} as const

// ============================================================
// GET — Obtener un corte por ID
// ============================================================
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const corte = await prisma.corte.findUnique({
      where: { id },
      include: INCLUDE_RELACIONES,
    })

    if (!corte) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ data: corte })
  } catch (error) {
    console.error('[GET /api/cortes/:id]', error)
    return NextResponse.json({ error: 'Error al obtener el corte' }, { status: 500 })
  }
}

// ============================================================
// PUT — Actualizar un corte (recalcula todos los indicadores)
// ============================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const body = await req.json()

    if (body.departamento && body.departamento !== DEPARTAMENTO_HABILITADO) {
      return NextResponse.json(
        { error: 'Usted no posee los permisos suficientes para continuar' },
        { status: 403 }
      )
    }

    const corteExistente = await prisma.corte.findUnique({ where: { id } })
    if (!corteExistente) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    const tipoTelaId = body.tipoTelaId || corteExistente.tipoTelaId
    const tipoTela = await prisma.tipoTela.findUnique({ where: { id: tipoTelaId } })
    if (!tipoTela) {
      return NextResponse.json({ error: 'Tipo de tela no encontrado' }, { status: 404 })
    }

    const largoM    = Number(body.largoTelaM   || corteExistente.largoTelaM)
    const anchoM    = Number(body.anchoTelaM   || corteExistente.anchoTelaM)
    const lineas    = Number(body.lineasTela   || corteExistente.lineasTela)
    const gramaje   = Number(body.gramajeGm2   || corteExistente.gramajeGm2)
    const referencia = body.referenciaPrenda   || corteExistente.referenciaPrenda
    const talla     = body.tallaPrenda         || corteExistente.tallaPrenda

    const resultados = calcularTodo({
      referenciaPrenda:  referencia as any,
      tallaPrenda:       talla as any,
      largoTelaM:        largoM,
      anchoTelaM:        anchoM,
      lineasTela:        lineas,
      gramajeGm2:        gramaje,
      composicionTextil: tipoTela.composicion,
    })

    const corteActualizado = await prisma.corte.update({
      where: { id },
      data: {
        ...(body.fechaCorte       && { fechaCorte:       new Date(body.fechaCorte) }),
        ...(body.departamento     && { departamento:     body.departamento }),
        ...(body.mesaCorteId      && { mesaCorteId:      Number(body.mesaCorteId) }),
        ...(body.operarioId       && { operarioId:       Number(body.operarioId) }),
        ...(body.tipoTelaId       && { tipoTelaId:       Number(body.tipoTelaId) }),
        ...(body.proveedorId      && { proveedorId:      Number(body.proveedorId) }),
        ...(body.loteTela         && { loteTela:         body.loteTela.trim() }),
        ...(body.referenciaPrenda && { referenciaPrenda: body.referenciaPrenda }),
        ...(body.tallaPrenda      && { tallaPrenda:      body.tallaPrenda }),
        largoTelaM: largoM,
        anchoTelaM: anchoM,
        lineasTela: lineas,
        gramajeGm2: gramaje,

        // Recalculados automáticamente
        areaPrendaM2:           resultados.areaPrendaM2,
        areaTotalDisponibleM2:  resultados.areaTotalDisponibleM2,
        prendasPorLinea:        resultados.prendasPorLinea,
        totalPrendas:           resultados.totalPrendas,
        areaConsumidaM2:        resultados.areaConsumidaM2,
        retalGeneradoM2:        resultados.retalGeneradoM2,
        pctRetal:               resultados.pctRetal,
        pctAprovechamiento:     resultados.pctAprovechamiento,
        pctReciclable:          resultados.pctReciclable,
        kgRetalGenerado:        resultados.kgRetalGenerado,
        destinoRetal:           resultados.destinoRetal,
        alertaRetal:            resultados.alertaRetal,
        alertaAprovechamiento:  resultados.alertaAprovechamiento,
      },
      include: INCLUDE_RELACIONES,
    })

    return NextResponse.json({
      data: corteActualizado,
      message: 'Corte actualizado exitosamente',
    })
  } catch (error) {
    console.error('[PUT /api/cortes/:id]', error)
    return NextResponse.json({ error: 'Error al actualizar el corte' }, { status: 500 })
  }
}

// ============================================================
// DELETE — Eliminar un corte
// ============================================================
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const corte = await prisma.corte.findUnique({ where: { id } })
    if (!corte) {
      return NextResponse.json({ error: 'Corte no encontrado' }, { status: 404 })
    }

    await prisma.corte.delete({ where: { id } })

    return NextResponse.json({ message: 'Corte eliminado exitosamente' })
  } catch (error) {
    console.error('[DELETE /api/cortes/:id]', error)
    return NextResponse.json({ error: 'Error al eliminar el corte' }, { status: 500 })
  }
}
