// src/app/api/reportes/route.ts
// GET /api/reportes?tipo=operativo|mensual|proveedor|tela|sostenibilidad|ejecutivo
// Genera los 6 tipos de reportes gerenciales con filtros opcionales

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { ApiResponse } from '@/types'

type TipoReporte = 'operativo' | 'mensual' | 'proveedor' | 'tela' | 'sostenibilidad' | 'ejecutivo'

const INCLUDE_FULL = {
  mesaCorte: true,
  operario:  true,
  tipoTela:  true,
  proveedor: true,
}

export async function GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const { searchParams } = new URL(req.url)

    const tipo    = (searchParams.get('tipo') || 'operativo') as TipoReporte
    const desde   = searchParams.get('desde')
    const hasta   = searchParams.get('hasta')
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

    let data: unknown

    switch (tipo) {
      // ----------------------------------------------------------
      // REPORTE OPERATIVO
      // Lista detallada de todos los cortes con todos sus campos
      // ----------------------------------------------------------
      case 'operativo': {
        const cortes = await prisma.corte.findMany({
          where,
          include: INCLUDE_FULL,
          orderBy: [{ fechaCorte: 'desc' }, { createdAt: 'desc' }],
        })
        data = {
          tipo:     'Reporte Operativo',
          total:    cortes.length,
          generado: new Date().toISOString(),
          filtros:  { desde, hasta, tipoTelaId, proveedorId, operarioId },
          registros: cortes.map(c => ({
            id:                     c.id,
            fecha:                  c.fechaCorte,
            mesa:                   c.mesaCorte.nombre,
            operario:               c.operario.nombre,
            tipoTela:               c.tipoTela.nombre,
            proveedor:              c.proveedor.nombre,
            lote:                   c.loteTela,
            referencia:             c.referenciaPrenda,
            talla:                  c.tallaPrenda,
            largoM:                 Number(c.largoTelaM),
            anchoM:                 Number(c.anchoTelaM),
            lineas:                 c.lineasTela,
            gramajeGm2:             c.gramajeGm2,
            areaPrendaM2:           Number(c.areaPrendaM2),
            areaTotalM2:            Number(c.areaTotalDisponibleM2),
            totalPrendas:           c.totalPrendas,
            areaConsumidaM2:        Number(c.areaConsumidaM2),
            retalM2:                Number(c.retalGeneradoM2),
            pctRetal:               Number(c.pctRetal),
            pctAprovechamiento:     Number(c.pctAprovechamiento),
            pctReciclable:          Number(c.pctReciclable),
            kgRetal:                Number(c.kgRetalGenerado),
            destino:                c.destinoRetal,
            alertaRetal:            c.alertaRetal,
            alertaAprovechamiento:  c.alertaAprovechamiento,
            createdAt:              c.createdAt,
          })),
        }
        break
      }

      // ----------------------------------------------------------
      // REPORTE MENSUAL
      // Resumen agrupado por mes con totales y promedios
      // ----------------------------------------------------------
      case 'mensual': {
        const cortes = await prisma.corte.findMany({
          where,
          select: {
            fechaCorte: true, pctAprovechamiento: true, pctRetal: true,
            retalGeneradoM2: true, kgRetalGenerado: true, totalPrendas: true,
            areaTotalDisponibleM2: true, destinoRetal: true,
            alertaRetal: true, alertaAprovechamiento: true,
          },
        })

        const meses = new Map<string, any>()
        for (const c of cortes) {
          const f = new Date(c.fechaCorte)
          const key = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}`
          if (!meses.has(key)) {
            meses.set(key, {
              mes: key, cortes: 0, prendas: 0,
              sumAprov: 0, sumRetal: 0,
              totalRetalM2: 0, totalKgRetal: 0, totalTelaM2: 0,
              reciclable: 0, desechado: 0,
              alertasRetal: 0, alertasAprov: 0,
            })
          }
          const m = meses.get(key)!
          m.cortes++
          m.prendas         += c.totalPrendas
          m.sumAprov        += Number(c.pctAprovechamiento)
          m.sumRetal        += Number(c.pctRetal)
          m.totalRetalM2    += Number(c.retalGeneradoM2)
          m.totalKgRetal    += Number(c.kgRetalGenerado)
          m.totalTelaM2     += Number(c.areaTotalDisponibleM2)
          if (c.destinoRetal === 'Reciclable') m.reciclable += Number(c.kgRetalGenerado)
          else m.desechado += Number(c.kgRetalGenerado)
          if (c.alertaRetal)            m.alertasRetal++
          if (c.alertaAprovechamiento)  m.alertasAprov++
        }

        data = {
          tipo:     'Reporte Mensual',
          generado: new Date().toISOString(),
          filtros:  { desde, hasta },
          meses: Array.from(meses.values()).sort((a, b) => a.mes.localeCompare(b.mes)).map(m => ({
            mes:                    m.mes,
            totalCortes:            m.cortes,
            totalPrendas:           m.prendas,
            totalTelaM2:            Math.round(m.totalTelaM2 * 100) / 100,
            totalRetalM2:           Math.round(m.totalRetalM2 * 100) / 100,
            totalKgRetal:           Math.round(m.totalKgRetal * 1000) / 1000,
            kgReciclables:          Math.round(m.reciclable * 1000) / 1000,
            kgDesechados:           Math.round(m.desechado * 1000) / 1000,
            avgPctAprovechamiento:  m.cortes > 0 ? Math.round(m.sumAprov / m.cortes * 100) / 100 : 0,
            avgPctRetal:            m.cortes > 0 ? Math.round(m.sumRetal / m.cortes * 100) / 100 : 0,
            alertasRetal:           m.alertasRetal,
            alertasAprovechamiento: m.alertasAprov,
          })),
        }
        break
      }

      // ----------------------------------------------------------
      // REPORTE POR PROVEEDOR
      // ----------------------------------------------------------
      case 'proveedor': {
        const grupos = await prisma.corte.groupBy({
          by: ['proveedorId'],
          where,
          _count: { id: true },
          _sum:   { retalGeneradoM2: true, kgRetalGenerado: true, totalPrendas: true, areaTotalDisponibleM2: true },
          _avg:   { pctRetal: true, pctAprovechamiento: true },
          _min:   { pctAprovechamiento: true },
          _max:   { pctAprovechamiento: true },
        })
        const provs = await prisma.proveedor.findMany()
        const provMap = new Map(provs.map(p => [p.id, p.nombre]))

        data = {
          tipo:     'Reporte por Proveedor',
          generado: new Date().toISOString(),
          filtros:  { desde, hasta },
          proveedores: grupos.map(g => ({
            proveedor:              provMap.get(g.proveedorId) || 'Desconocido',
            totalCortes:            g._count.id,
            totalPrendas:           g._sum.totalPrendas || 0,
            totalTelaM2:            Number(g._sum.areaTotalDisponibleM2 || 0),
            totalRetalM2:           Number(g._sum.retalGeneradoM2 || 0),
            totalKgRetal:           Number(g._sum.kgRetalGenerado || 0),
            avgPctRetal:            Number(g._avg.pctRetal || 0),
            avgPctAprovechamiento:  Number(g._avg.pctAprovechamiento || 0),
            minAprovechamiento:     Number(g._min.pctAprovechamiento || 0),
            maxAprovechamiento:     Number(g._max.pctAprovechamiento || 0),
          })).sort((a, b) => b.avgPctAprovechamiento - a.avgPctAprovechamiento),
        }
        break
      }

      // ----------------------------------------------------------
      // REPORTE POR TIPO DE TELA
      // ----------------------------------------------------------
      case 'tela': {
        const grupos = await prisma.corte.groupBy({
          by: ['tipoTelaId'],
          where,
          _count: { id: true },
          _sum:   { retalGeneradoM2: true, kgRetalGenerado: true, totalPrendas: true, areaTotalDisponibleM2: true },
          _avg:   { pctRetal: true, pctAprovechamiento: true, pctReciclable: true },
        })
        const telas = await prisma.tipoTela.findMany()
        const telaMap = new Map(telas.map(t => [t.id, t]))

        data = {
          tipo:     'Reporte por Tipo de Tela',
          generado: new Date().toISOString(),
          filtros:  { desde, hasta },
          telas: grupos.map(g => {
            const tela = telaMap.get(g.tipoTelaId)
            return {
              tipoTela:               tela?.nombre || 'Desconocido',
              composicion:            tela?.composicion || '',
              totalCortes:            g._count.id,
              totalPrendas:           g._sum.totalPrendas || 0,
              totalTelaM2:            Number(g._sum.areaTotalDisponibleM2 || 0),
              totalRetalM2:           Number(g._sum.retalGeneradoM2 || 0),
              totalKgRetal:           Number(g._sum.kgRetalGenerado || 0),
              avgPctRetal:            Number(g._avg.pctRetal || 0),
              avgPctAprovechamiento:  Number(g._avg.pctAprovechamiento || 0),
              avgPctReciclable:       Number(g._avg.pctReciclable || 0),
            }
          }).sort((a, b) => b.totalRetalM2 - a.totalRetalM2),
        }
        break
      }

      // ----------------------------------------------------------
      // REPORTE DE SOSTENIBILIDAD
      // Enfocado en economía circular: reciclables, destinos, huella
      // ----------------------------------------------------------
      case 'sostenibilidad': {
        const [totalAgg, reciclableAgg, desechadoAgg, porTela] = await Promise.all([
          prisma.corte.aggregate({
            where,
            _count: { id: true },
            _sum:   { kgRetalGenerado: true, retalGeneradoM2: true, areaTotalDisponibleM2: true },
            _avg:   { pctReciclable: true, pctRetal: true },
          }),
          prisma.corte.aggregate({
            where: { ...where, destinoRetal: 'Reciclable' },
            _count: { id: true },
            _sum:   { kgRetalGenerado: true },
          }),
          prisma.corte.aggregate({
            where: { ...where, destinoRetal: 'Desechado' },
            _count: { id: true },
            _sum:   { kgRetalGenerado: true },
          }),
          prisma.corte.groupBy({
            by: ['tipoTelaId'],
            where,
            _sum:   { kgRetalGenerado: true },
            _avg:   { pctReciclable: true },
            _count: { id: true },
          }),
        ])

        const telasSost = await prisma.tipoTela.findMany()
        const telaMapSost = new Map(telasSost.map(t => [t.id, t]))

        const totalKg = Number(totalAgg._sum.kgRetalGenerado || 0)

        data = {
          tipo:     'Reporte de Sostenibilidad',
          generado: new Date().toISOString(),
          filtros:  { desde, hasta },
          resumen: {
            totalCortes:         totalAgg._count.id,
            totalKgRetalGenerado: totalKg,
            totalM2RetalGenerado: Number(totalAgg._sum.retalGeneradoM2 || 0),
            totalM2TelaProcessada: Number(totalAgg._sum.areaTotalDisponibleM2 || 0),
            avgPctReciclable:    Number(totalAgg._avg.pctReciclable || 0),
            avgPctRetal:         Number(totalAgg._avg.pctRetal || 0),
          },
          destinoRetal: {
            reciclable: {
              cortes:  reciclableAgg._count.id,
              kgTotal: Number(reciclableAgg._sum.kgRetalGenerado || 0),
              pctKg:   totalKg > 0
                ? Math.round(Number(reciclableAgg._sum.kgRetalGenerado || 0) / totalKg * 10000) / 100
                : 0,
            },
            desechado: {
              cortes:  desechadoAgg._count.id,
              kgTotal: Number(desechadoAgg._sum.kgRetalGenerado || 0),
              pctKg:   totalKg > 0
                ? Math.round(Number(desechadoAgg._sum.kgRetalGenerado || 0) / totalKg * 10000) / 100
                : 0,
            },
          },
          porTipoTela: porTela.map(g => {
            const tela = telaMapSost.get(g.tipoTelaId)
            return {
              tipoTela:         tela?.nombre || 'Desconocido',
              composicion:      tela?.composicion || '',
              totalCortes:      g._count.id,
              kgRetalGenerado:  Number(g._sum.kgRetalGenerado || 0),
              avgPctReciclable: Number(g._avg.pctReciclable || 0),
            }
          }).sort((a, b) => b.kgRetalGenerado - a.kgRetalGenerado),
        }
        break
      }

      // ----------------------------------------------------------
      // REPORTE EJECUTIVO
      // Resumen de alto nivel para gerencia
      // ----------------------------------------------------------
      case 'ejecutivo': {
        const [agg, alertasR, alertasA, topOperario, mejorMesa] = await Promise.all([
          prisma.corte.aggregate({
            where,
            _count: { id: true },
            _sum:   { totalPrendas: true, kgRetalGenerado: true, areaTotalDisponibleM2: true, retalGeneradoM2: true },
            _avg:   { pctAprovechamiento: true, pctRetal: true, pctReciclable: true },
          }),
          prisma.corte.count({ where: { ...where, alertaRetal: true } }),
          prisma.corte.count({ where: { ...where, alertaAprovechamiento: true } }),
          prisma.corte.groupBy({
            by: ['operarioId'], where,
            _avg: { pctAprovechamiento: true },
            orderBy: { _avg: { pctAprovechamiento: 'desc' } },
            take: 1,
          }),
          prisma.corte.groupBy({
            by: ['mesaCorteId'], where,
            _avg: { pctAprovechamiento: true },
            orderBy: { _avg: { pctAprovechamiento: 'desc' } },
            take: 1,
          }),
        ])

        const opNombre = topOperario.length > 0
          ? (await prisma.operario.findUnique({ where: { id: topOperario[0].operarioId } }))?.nombre
          : 'N/A'
        const mesaNombre = mejorMesa.length > 0
          ? (await prisma.mesaCorte.findUnique({ where: { id: mejorMesa[0].mesaCorteId } }))?.nombre
          : 'N/A'

        data = {
          tipo:     'Reporte Ejecutivo',
          generado: new Date().toISOString(),
          filtros:  { desde, hasta },
          kpis: {
            totalCortes:            agg._count.id,
            totalPrendas:           agg._sum.totalPrendas || 0,
            totalTelaProcessadaM2:  Number(agg._sum.areaTotalDisponibleM2 || 0),
            totalRetalM2:           Number(agg._sum.retalGeneradoM2 || 0),
            totalKgRetal:           Number(agg._sum.kgRetalGenerado || 0),
            avgPctAprovechamiento:  Number(agg._avg.pctAprovechamiento || 0),
            avgPctRetal:            Number(agg._avg.pctRetal || 0),
            avgPctReciclable:       Number(agg._avg.pctReciclable || 0),
            alertasRetal:           alertasR,
            alertasAprovechamiento: alertasA,
            eficienciaTotal:        agg._count.id > 0
              ? Math.round((1 - alertasA / agg._count.id) * 10000) / 100
              : 100,
          },
          destacados: {
            mejorOperario:      opNombre,
            avgAprovMejorOp:    topOperario[0]?._avg.pctAprovechamiento || 0,
            mejorMesa:          mesaNombre,
            avgAprovMejorMesa:  mejorMesa[0]?._avg.pctAprovechamiento || 0,
          },
        }
        break
      }

      default:
        return NextResponse.json({ error: 'Tipo de reporte inválido' }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/reportes]', error)
    return NextResponse.json({ error: 'Error al generar el reporte' }, { status: 500 })
  }
}
