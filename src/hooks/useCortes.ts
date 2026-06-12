// src/hooks/useCortes.ts

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CorteDetalle } from '@/types'

interface Paginacion {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface FiltrosCortes {
  page?: number
  limit?: number
  desde?: string
  hasta?: string
  tipoTelaId?: number
  proveedorId?: number
  operarioId?: number
  mesaCorteId?: number
  referenciaPrenda?: string
  tallaPrenda?: string
  destinoRetal?: string
}

interface UseCortesReturn {
  cortes: CorteDetalle[]
  paginacion: Paginacion | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useCortes(filtros: FiltrosCortes = {}): UseCortesReturn {
  const [cortes, setCortes]         = useState<CorteDetalle[]>([])
  const [paginacion, setPaginacion] = useState<Paginacion | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [tick, setTick]             = useState(0)

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    async function cargar() {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filtros.page)            params.set('page',             String(filtros.page))
        if (filtros.limit)           params.set('limit',            String(filtros.limit))
        if (filtros.desde)           params.set('desde',            filtros.desde)
        if (filtros.hasta)           params.set('hasta',            filtros.hasta)
        if (filtros.tipoTelaId)      params.set('tipoTelaId',       String(filtros.tipoTelaId))
        if (filtros.proveedorId)     params.set('proveedorId',      String(filtros.proveedorId))
        if (filtros.operarioId)      params.set('operarioId',       String(filtros.operarioId))
        if (filtros.mesaCorteId)     params.set('mesaCorteId',      String(filtros.mesaCorteId))
        if (filtros.referenciaPrenda) params.set('referenciaPrenda', filtros.referenciaPrenda)
        if (filtros.tallaPrenda)     params.set('tallaPrenda',      filtros.tallaPrenda)
        if (filtros.destinoRetal)    params.set('destinoRetal',     filtros.destinoRetal)

        const res = await fetch(`/api/cortes?${params.toString()}`, {
          signal: controller.signal,
        })

        if (!res.ok) throw new Error('Error al cargar los cortes')
        const json = await res.json()
        setCortes(json.data.cortes)
        setPaginacion(json.data.pagination)
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
  }, [
    filtros.page, filtros.limit, filtros.desde, filtros.hasta,
    filtros.tipoTelaId, filtros.proveedorId, filtros.operarioId,
    filtros.mesaCorteId, filtros.referenciaPrenda, filtros.tallaPrenda,
    filtros.destinoRetal, tick,
  ])

  return { cortes, paginacion, loading, error, refetch }
}
