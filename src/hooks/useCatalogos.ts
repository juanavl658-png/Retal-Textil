// src/hooks/useCatalogos.ts
// Hook para cargar catálogos una vez y compartirlos en toda la app

'use client'

import { useState, useEffect } from 'react'
import type { Catalogos } from '@/types'

interface UseCatalogosReturn {
  catalogos: Catalogos | null
  loading: boolean
  error: string | null
}

export function useCatalogos(): UseCatalogosReturn {
  const [catalogos, setCatalogos] = useState<Catalogos | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function cargar() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/catalogos', { signal: controller.signal })
        if (!res.ok) throw new Error('No se pudieron cargar los catálogos')
        const json = await res.json()
        setCatalogos(json.data)
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
  }, [])

  return { catalogos, loading, error }
}
