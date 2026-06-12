// src/app/api/exportar/route.ts
// GET /api/exportar?formato=csv|json&tipo=cortes|reporte
// Exporta datos en CSV o JSON para descarga directa

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const formato  = searchParams.get('formato') || 'csv'   // csv | json
    const desde    = searchParams.get('desde')
    const hasta    = searchParams.get('hasta')
    const tipoTelaId   = searchParams.get('tipoTelaId')
    const proveedorId  = searchParams.get('proveedorId')
    const operarioId   = searchParams.get('operarioId')

    const where: any = {}
    if (desde || hasta) {
      where.fechaCorte = {}
      if (desde) where.fechaCorte.gte = new Date(desde)
      if (hasta) where.fechaCorte.lte = new Date(hasta)
    }
    if (tipoTelaId)  where.tipoTelaId  = parseInt(tipoTelaId)
    if (proveedorId) where.proveedorId = parseInt(proveedorId)
    if (operarioId)  where.operarioId  = parseInt(operarioId)

    const cortes = await prisma.corte.findMany({
      where,
      include: {
        mesaCorte: true,
        operario:  true,
        tipoTela:  true,
        proveedor: true,
      },
      orderBy: [{ fechaCorte: 'desc' }, { createdAt: 'desc' }],
    })

    // ============================================================
    // FORMATO JSON
    // ============================================================
    if (formato === 'json') {
      const jsonStr = JSON.stringify(cortes, null, 2)
      return new NextResponse(jsonStr, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="retal_textil_${fechaHoy()}.json"`,
        },
      })
    }

    // ============================================================
    // FORMATO CSV (default)
    // ============================================================
    const cabeceras = [
      'ID', 'Fecha Corte', 'Departamento', 'Mesa de Corte', 'Operario',
      'Tipo de Tela', 'Composición', 'Proveedor', 'Lote Tela',
      'Referencia Prenda', 'Talla', 'Largo Tela (m)', 'Ancho Tela (m)',
      'Líneas de Tela', 'Gramaje (g/m²)', 'Área Prenda (m²)',
      'Área Total Disponible (m²)', 'Prendas por Línea', 'Total Prendas',
      'Área Consumida (m²)', 'Retal Generado (m²)', '% Retal',
      '% Aprovechamiento', '% Reciclable', 'Kg Retal Generado',
      'Destino Retal', 'Alerta Retal', 'Alerta Aprovechamiento',
      'Fecha Registro',
    ]

    const filas = cortes.map(c => [
      c.id,
      formatFecha(c.fechaCorte),
      c.departamento,
      c.mesaCorte.nombre,
      c.operario.nombre,
      c.tipoTela.nombre,
      c.tipoTela.composicion,
      c.proveedor.nombre,
      c.loteTela,
      c.referenciaPrenda,
      c.tallaPrenda,
      Number(c.largoTelaM),
      Number(c.anchoTelaM),
      c.lineasTela,
      c.gramajeGm2,
      Number(c.areaPrendaM2),
      Number(c.areaTotalDisponibleM2),
      c.prendasPorLinea,
      c.totalPrendas,
      Number(c.areaConsumidaM2),
      Number(c.retalGeneradoM2),
      Number(c.pctRetal),
      Number(c.pctAprovechamiento),
      Number(c.pctReciclable),
      Number(c.kgRetalGenerado),
      c.destinoRetal,
      c.alertaRetal ? 'Sí' : 'No',
      c.alertaAprovechamiento ? 'Sí' : 'No',
      formatFecha(c.createdAt),
    ])

    const csv = [
      cabeceras.map(escaparCSV).join(','),
      ...filas.map(fila => fila.map(escaparCSV).join(',')),
    ].join('\n')

    // BOM para que Excel abra el CSV con tildes correctamente
    const bom = '\uFEFF'

    return new NextResponse(bom + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="retal_textil_${fechaHoy()}.csv"`,
      },
    })
  } catch (error) {
    console.error('[GET /api/exportar]', error)
    return NextResponse.json({ error: 'Error al exportar los datos' }, { status: 500 })
  }
}

// ============================================================
// UTILIDADES
// ============================================================

function escaparCSV(valor: unknown): string {
  const str = String(valor ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatFecha(fecha: Date): string {
  return new Date(fecha).toLocaleDateString('es-CO', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}

function fechaHoy(): string {
  return new Date().toISOString().split('T')[0]
}
