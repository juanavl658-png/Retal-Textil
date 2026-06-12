// src/lib/constantes.ts
// Catálogos estáticos y tablas de referencia del negocio

// ============================================================
// CATÁLOGOS ESTÁTICOS (no requieren BD)
// ============================================================

export const DEPARTAMENTOS = ['Corte', 'Almacen', 'inventario'] as const
export type Departamento = typeof DEPARTAMENTOS[number]

export const DEPARTAMENTO_HABILITADO = 'Corte'

export const TALLAS = ['S', 'M', 'L', 'XL'] as const
export type Talla = typeof TALLAS[number]

export const REFERENCIAS_PRENDA = ['Camisa', 'Pantalon', 'Buso', 'Chaqueta'] as const
export type ReferenciaPrenda = typeof REFERENCIAS_PRENDA[number]

export const DESTINOS_RETAL = ['Reciclable', 'Desechado'] as const
export type DestinoRetal = typeof DESTINOS_RETAL[number]

// ============================================================
// TABLA DE ÁREA DE PRENDA (m²) por referencia y talla
// Fuente: Especificación del proyecto / Hoja1 del Excel
// ============================================================

export const AREA_PRENDA_M2: Record<ReferenciaPrenda, Record<Talla, number>> = {
  Camisa:   { S: 0.40, M: 0.42, L: 0.45, XL: 0.48 },
  Pantalon: { S: 0.95, M: 1.05, L: 1.15, XL: 1.25 },
  Buso:     { S: 0.68, M: 0.76, L: 0.81, XL: 0.85 },
  Chaqueta: { S: 0.87, M: 0.98, L: 1.08, XL: 1.16 },
}

// ============================================================
// PORCENTAJE RECICLABLE POR COMPOSICIÓN TEXTIL
// Fuente: estimación basada en estándares de economía circular
// ============================================================

export const PCT_RECICLABLE_POR_COMPOSICION: Record<string, number> = {
  '100% Algodón':            95,
  '100% Poliéster':          70,
  'Mezcla Algodón/Poliéster':50,
  'Algodón/Poliéster':       55,
  'Algodón/Elastano':        60,
  'Poliéster/Nylon':         40,
  'Lana':                    80,
  'French Terry':            85,
}

export const PCT_RECICLABLE_DEFAULT = 30  // Para composiciones no listadas

// ============================================================
// UMBRALES DE ALERTAS
// ============================================================

export const UMBRAL_ALERTA_RETAL_PCT = 12      // % — si retal > 12% → alerta
export const UMBRAL_ALERTA_APROVECHAMIENTO_PCT = 90  // % — si aprovechamiento < 90% → alerta
export const UMBRAL_DESTINO_RECICLABLE_PCT = 60     // % — si reciclable ≥ 60% → "Reciclable"

// ============================================================
// RANGOS
// ============================================================

export const LINEAS_TELA_MIN = 1
export const LINEAS_TELA_MAX = 100
