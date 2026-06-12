// src/types/index.ts
// Tipos TypeScript globales del sistema

import type { Corte, TipoTela, Proveedor, Operario, MesaCorte } from '@prisma/client'

// ============================================================
// RE-EXPORTS DE PRISMA
// ============================================================
export type { Corte, TipoTela, Proveedor, Operario, MesaCorte }

// ============================================================
// CORTE DETALLADO (con joins de catálogos)
// ============================================================
export type CorteDetalle = Corte & {
  mesaCorte: MesaCorte
  operario: Operario
  tipoTela: TipoTela
  proveedor: Proveedor
}

// ============================================================
// FORMULARIO DE NUEVO CORTE
// ============================================================
export interface FormCorte {
  fechaCorte: string          // ISO date string YYYY-MM-DD
  departamento: string
  mesaCorteId: number
  operarioId: number
  tipoTelaId: number
  proveedorId: number
  loteTela: string
  referenciaPrenda: string
  tallaPrenda: string
  largoTelaM: number
  anchoTelaM: number
  lineasTela: number
  gramajeGm2: number
}

// ============================================================
// CATÁLOGOS (para poblado de selects en el formulario)
// ============================================================
export interface Catalogos {
  tiposTela: TipoTela[]
  proveedores: Proveedor[]
  operarios: Operario[]
  mesas: MesaCorte[]
}

// ============================================================
// KPIS PARA EL DASHBOARD
// ============================================================
export interface KpisGlobales {
  totalCortes: number
  totalTelaM2: number
  totalRetalM2: number
  totalKgRetal: number
  avgPctAprovechamiento: number
  avgPctRetal: number
  kgReciclables: number
  kgDesechados: number
  totalAlertasRetal: number
  totalAlertasAprovechamiento: number
}

// ============================================================
// DATOS PARA GRÁFICOS
// ============================================================
export interface DatoRetalTela {
  tipoTela: string
  totalRetalM2: number
  totalKgRetal: number
  avgPctRetal: number
  totalCortes: number
}

export interface DatoProveedor {
  proveedor: string
  totalRetalM2: number
  totalKgRetal: number
  avgPctRetal: number
  totalCortes: number
}

export interface DatoMensual {
  mes: string
  mesLabel: string
  totalCortes: number
  avgPctAprovechamiento: number
  avgPctRetal: number
  totalRetalM2: number
  totalKgRetal: number
  totalPrendas: number
}

export interface DatoOperario {
  operario: string
  totalCortes: number
  avgAprovechamiento: number
  avgPctRetal: number
  totalPrendas: number
  totalKgRetal: number
}

export interface DatoMesa {
  mesaCorte: string
  totalCortes: number
  avgAprovechamiento: number
  avgPctRetal: number
  totalPrendas: number
  totalRetalM2: number
}

export interface DatoDestino {
  destinoRetal: string
  totalCortes: number
  totalKg: number
  totalM2: number
  pctSobreTotal: number
}

// ============================================================
// DATOS COMPLETOS DEL DASHBOARD
// ============================================================
export interface DatosDashboard {
  kpis: KpisGlobales
  retalPorTela: DatoRetalTela[]
  retalPorProveedor: DatoProveedor[]
  aprovechamientoMensual: DatoMensual[]
  rankingOperarios: DatoOperario[]
  rankingMesas: DatoMesa[]
  distribucionDestinos: DatoDestino[]
}

// ============================================================
// FILTROS DE REPORTE
// ============================================================
export interface FiltrosReporte {
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

// ============================================================
// RESPUESTA GENÉRICA DE LA API
// ============================================================
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
