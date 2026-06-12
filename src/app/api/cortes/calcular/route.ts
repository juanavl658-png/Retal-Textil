// src/app/api/cortes/calcular/route.ts
// POST /api/cortes/calcular
// Previsualiza los indicadores calculados SIN guardar en base de datos.
// El frontend lo llama en tiempo real mientras el usuario completa el formulario.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcularTodo, gramajePromedio } from '@/lib/calculos'
import type { ApiResponse } from '@/types'
import type { ResultadosCorte } from '@/lib/calculos'

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<ResultadosCorte>>> {
  try {
    const body = await req.json()

    const {
      referenciaPrenda,
      tallaPrenda,
      largoTelaM,
      anchoTelaM,
      lineasTela,
      tipoTelaId,
      gramajeGm2,
    } = body

    // Validar campos mínimos para calcular
    if (!referenciaPrenda || !tallaPrenda || !largoTelaM || !anchoTelaM || !lineasTela || !tipoTelaId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos para calcular' },
        { status: 400 }
      )
    }

    // Obtener composición textil del tipo de tela
    const tipoTela = await prisma.tipoTela.findUnique({
      where: { id: Number(tipoTelaId) },
    })
    if (!tipoTela) {
      return NextResponse.json({ error: 'Tipo de tela no encontrado' }, { status: 404 })
    }

    const gramaje = gramajeGm2 || gramajePromedio(tipoTela.gramajeMin, tipoTela.gramajeMax)

    const resultados = calcularTodo({
      referenciaPrenda,
      tallaPrenda,
      largoTelaM:       Number(largoTelaM),
      anchoTelaM:       Number(anchoTelaM),
      lineasTela:       Number(lineasTela),
      gramajeGm2:       gramaje,
      composicionTextil: tipoTela.composicion,
    })

    return NextResponse.json({ data: resultados })
  } catch (error) {
    console.error('[POST /api/cortes/calcular]', error)
    return NextResponse.json(
      { error: 'Error al calcular los indicadores' },
      { status: 500 }
    )
  }
}
