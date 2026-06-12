// src/hooks/useDashboard.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DatosDashboard } from '@/types'

interface UseDashboardReturn {
  datos: DatosDashboard | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useDashboard(
  filtros?: { desde?: string; hasta?: string }
): UseDashboardReturn {
  const [datos, setDatos]     = useState<DatosDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [tick, setTick]       = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function cargar() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filtros?.desde) params.set('desde', filtros.desde)
        if (filtros?.hasta) params.set('hasta', filtros.hasta)

        const url = `/api/dashboard${params.toString() ? '?' + params.toString() : ''}`
        const res = await fetch(url, { signal: controller.signal })

        if (!res.ok) throw new Error('Error al cargar el dashboard')
        const json = await res.json()
        setDatos(json.data)
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'Error desconocido')
        }
      } finally {
        setLoading(false)
      }
    }

    cargar()
    return () => controller.abort()
  }, [filtros?.desde, filtros?.hasta, tick])

  return { datos, loading, error, refetch }
}
