// src/lib/calculos.ts
// Motor de cálculo del negocio — todas las fórmulas del sistema
// Cada función está documentada con la fórmula correspondiente

import {
  AREA_PRENDA_M2,
  PCT_RECICLABLE_POR_COMPOSICION,
  PCT_RECICLABLE_DEFAULT,
  UMBRAL_ALERTA_RETAL_PCT,
  UMBRAL_ALERTA_APROVECHAMIENTO_PCT,
  UMBRAL_DESTINO_RECICLABLE_PCT,
  type ReferenciaPrenda,
  type Talla,
  type DestinoRetal,
} from './constantes'

// ============================================================
// TIPOS
// ============================================================

export interface InputsCorte {
  referenciaPrenda: ReferenciaPrenda
  tallaPrenda: Talla
  largoTelaM: number
  anchoTelaM: number
  lineasTela: number
  gramajeGm2: number
  composicionTextil: string
}

export interface ResultadosCorte {
  // Área de prenda
  areaPrendaM2: number

  // Consumo
  areaTotalDisponibleM2: number
  prendasPorLinea: number
  totalPrendas: number
  areaConsumidaM2: number

  // Retal
  retalGeneradoM2: number

  // Porcentajes
  pctRetal: number
  pctAprovechamiento: number
  pctReciclable: number

  // Peso
  kgRetalGenerado: number

  // Destino
  destinoRetal: DestinoRetal

  // Alertas
  alertaRetal: boolean
  alertaAprovechamiento: boolean
}

// ============================================================
// F-01: Área de Prenda
// Área (m²) = TABLA[referencia][talla]
// ============================================================
export function calcularAreaPrenda(
  referencia: ReferenciaPrenda,
  talla: Talla
): number {
  return AREA_PRENDA_M2[referencia][talla]
}

// ============================================================
// F-02: Área Total Disponible
// AreaTotal = LargoTela (m) × AnchoTela (m)
// ============================================================
export function calcularAreaTotal(largoM: number, anchoM: number): number {
  return redondear(largoM * anchoM, 3)
}

// ============================================================
// F-03: Prendas por Línea
// PrendasPorLinea = FLOOR(AreaTotal / AreaPrenda)
// Se usa FLOOR porque no pueden cortarse fracciones de prenda
// ============================================================
export function calcularPrendasPorLinea(
  areaTotal: number,
  areaPrenda: number
): number {
  return Math.floor(areaTotal / areaPrenda)
}

// ============================================================
// F-04: Total de Prendas
// TotalPrendas = PrendasPorLinea × LineasTela
// ============================================================
export function calcularTotalPrendas(
  prendasPorLinea: number,
  lineasTela: number
): number {
  return prendasPorLinea * lineasTela
}

// ============================================================
// F-05: Área Consumida
// AreaConsumida = TotalPrendas × AreaPrenda
// ============================================================
export function calcularAreaConsumida(
  totalPrendas: number,
  areaPrenda: number
): number {
  return redondear(totalPrendas * areaPrenda, 3)
}

// ============================================================
// F-06: Retal Generado
// RetalGenerado = AreaTotal - AreaConsumida
// ============================================================
export function calcularRetalGenerado(
  areaTotal: number,
  areaConsumida: number
): number {
  return redondear(Math.max(0, areaTotal - areaConsumida), 3)
}

// ============================================================
// F-07: Porcentaje de Retal
// PctRetal = (RetalGenerado / AreaTotal) × 100
// ============================================================
export function calcularPctRetal(
  retalGenerado: number,
  areaTotal: number
): number {
  if (areaTotal === 0) return 0
  return redondear((retalGenerado / areaTotal) * 100, 2)
}

// ============================================================
// F-08: Porcentaje de Aprovechamiento
// PctAprovechamiento = 100 - PctRetal
// ============================================================
export function calcularPctAprovechamiento(pctRetal: number): number {
  return redondear(100 - pctRetal, 2)
}

// ============================================================
// F-09: Porcentaje Potencialmente Reciclable
// Basado en la composición textil del material
// ============================================================
export function calcularPctReciclable(composicion: string): number {
  // Busca coincidencia exacta primero
  if (PCT_RECICLABLE_POR_COMPOSICION[composicion] !== undefined) {
    return PCT_RECICLABLE_POR_COMPOSICION[composicion]
  }
  // Busca coincidencia parcial (por si la composición tiene variaciones menores)
  const clave = Object.keys(PCT_RECICLABLE_POR_COMPOSICION).find(
    (k) => composicion.toLowerCase().includes(k.toLowerCase())
  )
  return clave ? PCT_RECICLABLE_POR_COMPOSICION[clave] : PCT_RECICLABLE_DEFAULT
}

// ============================================================
// F-10: Kilogramos de Retal Generado
// KgRetal = RetalGenerado (m²) × GramajePromedio (g/m²) / 1000
// Para gramajes con rango (ej: 400-450), se usa el promedio
// ============================================================
export function calcularKgRetal(
  retalM2: number,
  gramajeGm2: number
): number {
  return redondear((retalM2 * gramajeGm2) / 1000, 3)
}

// ============================================================
// F-11: Destino del Retal
// SI PctReciclable >= UMBRAL → "Reciclable" SINO → "Desechado"
// ============================================================
export function calcularDestinoRetal(pctReciclable: number): DestinoRetal {
  return pctReciclable >= UMBRAL_DESTINO_RECICLABLE_PCT
    ? 'Reciclable'
    : 'Desechado'
}

// ============================================================
// CALCULADOR PRINCIPAL — Aplica todas las fórmulas de una vez
// ============================================================
export function calcularTodo(inputs: InputsCorte): ResultadosCorte {
  const areaPrendaM2 = calcularAreaPrenda(
    inputs.referenciaPrenda,
    inputs.tallaPrenda
  )

  const areaTotalDisponibleM2 = calcularAreaTotal(
    inputs.largoTelaM * inputs.lineasTela,
    inputs.anchoTelaM
  )

  const prendasPorLinea = calcularPrendasPorLinea(
    areaTotalDisponibleM2,
    areaPrendaM2
  )

  const totalPrendas = calcularTotalPrendas(prendasPorLinea, inputs.lineasTela)

  const areaConsumidaM2 = calcularAreaConsumida(totalPrendas, areaPrendaM2)

  const retalGeneradoM2 = calcularRetalGenerado(
    areaTotalDisponibleM2,
    areaConsumidaM2
  )

  const pctRetal = calcularPctRetal(retalGeneradoM2, areaTotalDisponibleM2)
  const pctAprovechamiento = calcularPctAprovechamiento(pctRetal)
  const pctReciclable = calcularPctReciclable(inputs.composicionTextil)
  const kgRetalGenerado = calcularKgRetal(retalGeneradoM2, inputs.gramajeGm2)
  const destinoRetal = calcularDestinoRetal(pctReciclable)

  const alertaRetal = pctRetal > UMBRAL_ALERTA_RETAL_PCT
  const alertaAprovechamiento = pctAprovechamiento < UMBRAL_ALERTA_APROVECHAMIENTO_PCT

  return {
    areaPrendaM2,
    areaTotalDisponibleM2,
    prendasPorLinea,
    totalPrendas,
    areaConsumidaM2,
    retalGeneradoM2,
    pctRetal,
    pctAprovechamiento,
    pctReciclable,
    kgRetalGenerado,
    destinoRetal,
    alertaRetal,
    alertaAprovechamiento,
  }
}

// ============================================================
// UTILIDAD: Gramaje promedio para rangos (ej: 400-450 → 425)
// ============================================================
export function gramajePromedio(min: number, max: number): number {
  return Math.round((min + max) / 2)
}

// ============================================================
// UTILIDAD: Redondear a N decimales
// ============================================================
function redondear(valor: number, decimales: number): number {
  const factor = Math.pow(10, decimales)
  return Math.round(valor * factor) / factor
}
