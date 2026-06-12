// src/app/api/cortes/route.ts
// GET  /api/cortes — Lista cortes con filtros opcionales y paginación
// POST /api/cortes — Registra un nuevo corte y calcula todos los indicadores

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularTodo, gramajePromedio } from '@/lib/calculos'
import { DEPARTAMENTO_HABILITADO } from '@/lib/constantes'
import type { ApiResponse, FormCorte, CorteDetalle } from '@/types'

// ============================================================
// GET — Listar cortes con filtros y paginación
// ============================================================
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)

    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'))
    const limit    = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const skip     = (page - 1) * limit

    // Filtros opcionales
    const desde           = searchParams.get('desde')
    const hasta           = searchParams.get('hasta')
    const tipoTelaId      = searchParams.get('tipoTelaId')
    const proveedorId     = searchParams.get('proveedorId')
    const operarioId      = searchParams.get('operarioId')
    const mesaCorteId     = searchParams.get('mesaCorteId')
    const referenciaPrenda = searchParams.get('referenciaPrenda')
    const tallaPrenda     = searchParams.get('tallaPrenda')
    const destinoRetal    = searchParams.get('destinoRetal')

    const where: any = {}

    if (desde || hasta) {
      where.fechaCorte = {}
      if (desde) where.fechaCorte.gte = new Date(desde)
      if (hasta) where.fechaCorte.lte = new Date(hasta)
    }
    if (tipoTelaId)      where.tipoTelaId      = parseInt(tipoTelaId)
    if (proveedorId)     where.proveedorId     = parseInt(proveedorId)
    if (operarioId)      where.operarioId      = parseInt(operarioId)
    if (mesaCorteId)     where.mesaCorteId     = parseInt(mesaCorteId)
    if (referenciaPrenda) where.referenciaPrenda = referenciaPrenda
    if (tallaPrenda)     where.tallaPrenda     = tallaPrenda
    if (destinoRetal)    where.destinoRetal    = destinoRetal

    const [cortes, total] = await Promise.all([
      prisma.corte.findMany({
        where,
        include: {
          mesaCorte: true,
          operario:  true,
          tipoTela:  true,
          proveedor: true,
        },
        orderBy: [{ fechaCorte: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.corte.count({ where }),
    ])

    return NextResponse.json({
      data: {
        cortes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    })
  } catch (error) {
    console.error('[GET /api/cortes]', error)
    return NextResponse.json({ error: 'Error al obtener los cortes' }, { status: 500 })
  }
}

// ============================================================
// POST — Crear nuevo corte (con cálculo automático de indicadores)
// ============================================================
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body: FormCorte = await req.json()

    // --- Validación: Regla Excluyente por Departamento (RN-01) ---
    if (body.departamento !== DEPARTAMENTO_HABILITADO) {
      return NextResponse.json(
        { error: 'Usted no posee los permisos suficientes para continuar' },
        { status: 403 }
      )
    }

    // --- Validaciones de campos requeridos ---
    const camposRequeridos: (keyof FormCorte)[] = [
      'fechaCorte', 'departamento', 'mesaCorteId', 'operarioId',
      'tipoTelaId', 'proveedorId', 'loteTela', 'referenciaPrenda',
      'tallaPrenda', 'largoTelaM', 'anchoTelaM', 'lineasTela', 'gramajeGm2',
    ]
    for (const campo of camposRequeridos) {
      if (body[campo] === undefined || body[campo] === null || body[campo] === '') {
        return NextResponse.json(
          { error: `El campo "${campo}" es requerido` },
          { status: 400 }
        )
      }
    }

    // --- Validaciones de rango ---
    if (body.largoTelaM <= 0) {
      return NextResponse.json({ error: 'El largo de tela debe ser mayor a 0' }, { status: 400 })
    }
    if (body.anchoTelaM <= 0) {
      return NextResponse.json({ error: 'El ancho de tela debe ser mayor a 0' }, { status: 400 })
    }
    if (body.lineasTela < 1 || body.lineasTela > 100) {
      return NextResponse.json({ error: 'Las líneas de tela deben estar entre 1 y 100' }, { status: 400 })
    }

    // --- Obtener composición textil del tipo de tela ---
    const tipoTela = await prisma.tipoTela.findUnique({
      where: { id: body.tipoTelaId },
    })
    if (!tipoTela) {
      return NextResponse.json({ error: 'Tipo de tela no encontrado' }, { status: 404 })
    }

    // --- Calcular gramaje promedio si es rango ---
    const gramaje = body.gramajeGm2 || gramajePromedio(tipoTela.gramajeMin, tipoTela.gramajeMax)

    // --- Motor de cálculo (todas las fórmulas) ---
    const resultados = calcularTodo({
      referenciaPrenda: body.referenciaPrenda as any,
      tallaPrenda:      body.tallaPrenda as any,
      largoTelaM:       Number(body.largoTelaM),
      anchoTelaM:       Number(body.anchoTelaM),
      lineasTela:       Number(body.lineasTela),
      gramajeGm2:       gramaje,
      composicionTextil: tipoTela.composicion,
    })

    // --- Persistir en base de datos ---
    const corte = await prisma.corte.create({
      data: {
        fechaCorte:        new Date(body.fechaCorte),
        departamento:      body.departamento,
        mesaCorteId:       Number(body.mesaCorteId),
        operarioId:        Number(body.operarioId),
        tipoTelaId:        Number(body.tipoTelaId),
        proveedorId:       Number(body.proveedorId),
        loteTela:          body.loteTela.trim(),
        referenciaPrenda:  body.referenciaPrenda,
        tallaPrenda:       body.tallaPrenda,
        largoTelaM:        Number(body.largoTelaM),
        anchoTelaM:        Number(body.anchoTelaM),
        lineasTela:        Number(body.lineasTela),
        gramajeGm2:        gramaje,

        // Calculados
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
      include: {
        mesaCorte: true,
        operario:  true,
        tipoTela:  true,
        proveedor: true,
      },
    })

    return NextResponse.json(
      { data: corte, message: 'Corte registrado exitosamente' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[POST /api/cortes]', error)
    return NextResponse.json(
      { error: 'Error al registrar el corte' },
      { status: 500 }
    )
  }
}
