// src/app/api/dashboard/route.ts
// GET /api/dashboard — KPIs globales y datos para todos los gráficos del dashboard

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse, DatosDashboard } from '@/types'

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse<DatosDashboard>>> {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const whereBase: any = {}
    if (desde || hasta) {
      whereBase.fechaCorte = {}
      if (desde) whereBase.fechaCorte.gte = new Date(desde)
      if (hasta) whereBase.fechaCorte.lte = new Date(hasta)
    }

    // ============================================================
    // 1. KPIs GLOBALES
    // ============================================================
    const kpisRaw = await prisma.corte.aggregate({
      where: whereBase,
      _count: { id: true },
      _sum: {
        areaTotalDisponibleM2: true,
        retalGeneradoM2:       true,
        kgRetalGenerado:       true,
        totalPrendas:          true,
      },
      _avg: {
        pctAprovechamiento: true,
        pctRetal:           true,
      },
    })

    const kgReciclables = await prisma.corte.aggregate({
      where: { ...whereBase, destinoRetal: 'Reciclable' },
      _sum: { kgRetalGenerado: true },
    })

    const kgDesechados = await prisma.corte.aggregate({
      where: { ...whereBase, destinoRetal: 'Desechado' },
      _sum: { kgRetalGenerado: true },
    })

    const alertasRetal = await prisma.corte.count({
      where: { ...whereBase, alertaRetal: true },
    })

    const alertasAprovechamiento = await prisma.corte.count({
      where: { ...whereBase, alertaAprovechamiento: true },
    })

    const kpis = {
      totalCortes:              kpisRaw._count.id,
      totalTelaM2:              Number(kpisRaw._sum.areaTotalDisponibleM2 || 0),
      totalRetalM2:             Number(kpisRaw._sum.retalGeneradoM2 || 0),
      totalKgRetal:             Number(kpisRaw._sum.kgRetalGenerado || 0),
      avgPctAprovechamiento:    Number(kpisRaw._avg.pctAprovechamiento || 0),
      avgPctRetal:              Number(kpisRaw._avg.pctRetal || 0),
      kgReciclables:            Number(kgReciclables._sum.kgRetalGenerado || 0),
      kgDesechados:             Number(kgDesechados._sum.kgRetalGenerado || 0),
      totalAlertasRetal:        alertasRetal,
      totalAlertasAprovechamiento: alertasAprovechamiento,
    }

    // ============================================================
    // 2. RETAL POR TIPO DE TELA
    // ============================================================
    const retalPorTelaRaw = await prisma.corte.groupBy({
      by: ['tipoTelaId'],
      where: whereBase,
      _count: { id: true },
      _sum:   { retalGeneradoM2: true, kgRetalGenerado: true },
      _avg:   { pctRetal: true, pctAprovechamiento: true },
      orderBy: { _sum: { retalGeneradoM2: 'desc' } },
    })

    const tiposTela = await prisma.tipoTela.findMany()
    const tiposTelaMap = new Map(tiposTela.map(t => [t.id, t.nombre]))

    const retalPorTela = retalPorTelaRaw.map(r => ({
      tipoTela:      tiposTelaMap.get(r.tipoTelaId) || 'Desconocido',
      totalCortes:   r._count.id,
      totalRetalM2:  Number(r._sum.retalGeneradoM2 || 0),
      totalKgRetal:  Number(r._sum.kgRetalGenerado || 0),
      avgPctRetal:   Number(r._avg.pctRetal || 0),
      avgPctAprovechamiento: Number(r._avg.pctAprovechamiento || 0),
    }))

    // ============================================================
    // 3. RETAL POR PROVEEDOR
    // ============================================================
    const retalPorProveedorRaw = await prisma.corte.groupBy({
      by: ['proveedorId'],
      where: whereBase,
      _count: { id: true },
      _sum:   { retalGeneradoM2: true, kgRetalGenerado: true },
      _avg:   { pctRetal: true },
      orderBy: { _sum: { retalGeneradoM2: 'desc' } },
    })

    const proveedores = await prisma.proveedor.findMany()
    const proveedoresMap = new Map(proveedores.map(p => [p.id, p.nombre]))

    const retalPorProveedor = retalPorProveedorRaw.map(r => ({
      proveedor:     proveedoresMap.get(r.proveedorId) || 'Desconocido',
      totalCortes:   r._count.id,
      totalRetalM2:  Number(r._sum.retalGeneradoM2 || 0),
      totalKgRetal:  Number(r._sum.kgRetalGenerado || 0),
      avgPctRetal:   Number(r._avg.pctRetal || 0),
    }))

    // ============================================================
    // 4. APROVECHAMIENTO POR MES (últimos 12 meses)
    // ============================================================
    const cortesParaMes = await prisma.corte.findMany({
      where: whereBase,
      select: {
        fechaCorte:          true,
        pctAprovechamiento:  true,
        pctRetal:            true,
        retalGeneradoM2:     true,
        kgRetalGenerado:     true,
        totalPrendas:        true,
      },
      orderBy: { fechaCorte: 'asc' },
    })

    // Agrupar por mes en JS (Prisma no soporta DATE_TRUNC nativo en groupBy)
    const mesesMap = new Map<string, {
      mes: string; mesLabel: string; totalCortes: number;
      sumAprovechamiento: number; sumPctRetal: number;
      totalRetalM2: number; totalKgRetal: number; totalPrendas: number
    }>()

    for (const c of cortesParaMes) {
      const fecha = new Date(c.fechaCorte)
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      const label = key

      if (!mesesMap.has(key)) {
        mesesMap.set(key, {
          mes: key, mesLabel: label, totalCortes: 0,
          sumAprovechamiento: 0, sumPctRetal: 0,
          totalRetalM2: 0, totalKgRetal: 0, totalPrendas: 0,
        })
      }
      const entry = mesesMap.get(key)!
      entry.totalCortes++
      entry.sumAprovechamiento += Number(c.pctAprovechamiento)
      entry.sumPctRetal        += Number(c.pctRetal)
      entry.totalRetalM2       += Number(c.retalGeneradoM2)
      entry.totalKgRetal       += Number(c.kgRetalGenerado)
      entry.totalPrendas       += c.totalPrendas
    }

    const aprovechamientoMensual = Array.from(mesesMap.values()).map(m => ({
      mes:                    m.mes,
      mesLabel:               m.mesLabel,
      totalCortes:            m.totalCortes,
      avgPctAprovechamiento:  m.totalCortes > 0 ? m.sumAprovechamiento / m.totalCortes : 0,
      avgPctRetal:            m.totalCortes > 0 ? m.sumPctRetal / m.totalCortes : 0,
      totalRetalM2:           m.totalRetalM2,
      totalKgRetal:           m.totalKgRetal,
      totalPrendas:           m.totalPrendas,
    }))

    // ============================================================
    // 5. RANKING DE OPERARIOS
    // ============================================================
    const rankingOperariosRaw = await prisma.corte.groupBy({
      by: ['operarioId'],
      where: whereBase,
      _count: { id: true },
      _avg:   { pctAprovechamiento: true, pctRetal: true },
      _sum:   { totalPrendas: true, kgRetalGenerado: true },
      orderBy: { _avg: { pctAprovechamiento: 'desc' } },
    })

    const operarios = await prisma.operario.findMany()
    const operariosMap = new Map(operarios.map(o => [o.id, o.nombre]))

    const rankingOperarios = rankingOperariosRaw.map(r => ({
      operario:          operariosMap.get(r.operarioId) || 'Desconocido',
      totalCortes:       r._count.id,
      avgAprovechamiento: Number(r._avg.pctAprovechamiento || 0),
      avgPctRetal:       Number(r._avg.pctRetal || 0),
      totalPrendas:      r._sum.totalPrendas || 0,
      totalKgRetal:      Number(r._sum.kgRetalGenerado || 0),
    }))

    // ============================================================
    // 6. RANKING DE MESAS
    // ============================================================
    const rankingMesasRaw = await prisma.corte.groupBy({
      by: ['mesaCorteId'],
      where: whereBase,
      _count: { id: true },
      _avg:   { pctAprovechamiento: true, pctRetal: true },
      _sum:   { totalPrendas: true, retalGeneradoM2: true },
      orderBy: { _avg: { pctAprovechamiento: 'desc' } },
    })

    const mesas = await prisma.mesaCorte.findMany()
    const mesasMap = new Map(mesas.map(m => [m.id, m.nombre]))

    const rankingMesas = rankingMesasRaw.map(r => ({
      mesaCorte:         mesasMap.get(r.mesaCorteId) || 'Desconocido',
      totalCortes:       r._count.id,
      avgAprovechamiento: Number(r._avg.pctAprovechamiento || 0),
      avgPctRetal:       Number(r._avg.pctRetal || 0),
      totalPrendas:      r._sum.totalPrendas || 0,
      totalRetalM2:      Number(r._sum.retalGeneradoM2 || 0),
    }))

    // ============================================================
    // 7. DISTRIBUCIÓN DE DESTINOS
    // ============================================================
    const destinosRaw = await prisma.corte.groupBy({
      by: ['destinoRetal'],
      where: whereBase,
      _count: { id: true },
      _sum:   { kgRetalGenerado: true, retalGeneradoM2: true },
    })

    const totalCortesDestinos = destinosRaw.reduce((acc, d) => acc + d._count.id, 0)

    const distribucionDestinos = destinosRaw.map(d => ({
      destinoRetal:   d.destinoRetal,
      totalCortes:    d._count.id,
      totalKg:        Number(d._sum.kgRetalGenerado || 0),
      totalM2:        Number(d._sum.retalGeneradoM2 || 0),
      pctSobreTotal:  totalCortesDestinos > 0
        ? Math.round((d._count.id / totalCortesDestinos) * 10000) / 100
        : 0,
    }))

    // ============================================================
    // RESPUESTA FINAL
    // ============================================================
    const dashboard: DatosDashboard = {
      kpis,
      retalPorTela,
      retalPorProveedor,
      aprovechamientoMensual,
      rankingOperarios,
      rankingMesas,
      distribucionDestinos,
    }

    return NextResponse.json({ data: dashboard })
  } catch (error) {
    console.error('[GET /api/dashboard]', error)
    return NextResponse.json(
      { error: 'Error al obtener datos del dashboard' },
      { status: 500 }
    )
  }
}
export const dynamic = 'force-dynamic'
