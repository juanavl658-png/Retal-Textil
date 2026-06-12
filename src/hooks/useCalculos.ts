// src/hooks/useCalculos.ts
// Hook para previsualizar cálculos en tiempo real mientras el usuario llena el formulario

'use client'

import { useState, useCallback } from 'react'
import type { ResultadosCorte } from '@/lib/calculos'

interface UseCalculosReturn {
  resultados: ResultadosCorte | null
  calculando: boolean
  calcular: (params: {
    referenciaPrenda: string
    tallaPrenda: string
    largoTelaM: number
    anchoTelaM: number
    lineasTela: number
    tipoTelaId: number
    gramajeGm2?: number
  }) => Promise<void>
  limpiar: () => void
}

export function useCalculos(): UseCalculosReturn {
  const [resultados, setResultados] = useState<ResultadosCorte | null>(null)
  const [calculando, setCalculando] = useState(false)

  const calcular = useCallback(async (params: {
    referenciaPrenda: string
    tallaPrenda: string
    largoTelaM: number
    anchoTelaM: number
    lineasTela: number
    tipoTelaId: number
    gramajeGm2?: number
  }) => {
    // No calcular si faltan campos esenciales
    if (
      !params.referenciaPrenda ||
      !params.tallaPrenda ||
      !params.largoTelaM ||
      !params.anchoTelaM ||
      !params.lineasTela ||
      !params.tipoTelaId
    ) {
      setResultados(null)
      return
    }

    try {
      setCalculando(true)
      const res = await fetch('/api/cortes/calcular', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      })

      if (!res.ok) {
        setResultados(null)
        return
      }

      const json = await res.json()
      setResultados(json.data)
    } catch {
      setResultados(null)
    } finally {
      setCalculando(false)
    }
  }, [])

  const limpiar = useCallback(() => setResultados(null), [])

  return { resultados, calculando, calcular, limpiar }
}
