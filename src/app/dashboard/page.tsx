'use client'
// src/app/dashboard/page.tsx
// Dashboard gerencial completo — KPIs + 7 gráficos interactivos

import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { Card, SectionHeader, Input, Label, LoadingState, EmptyState, Spinner } from '@/components/ui'

// ============================================================
// PALETA DE COLORES PARA GRÁFICOS
// ============================================================
const COLORES = {
  primario:   '#5264f5',
  exito:      '#10b981',
  advertencia:'#f59e0b',
  peligro:    '#ef4444',
  violeta:    '#8b5cf6',
  cian:       '#06b6d4',
  rosa:       '#ec4899',
  naranja:    '#f97316',
}

const PALETA_SERIE = [
  COLORES.primario, COLORES.exito, COLORES.advertencia,
  COLORES.violeta,  COLORES.cian,  COLORES.rosa,
  COLORES.naranja,  COLORES.peligro,
]

// ============================================================
// TOOLTIP PERSONALIZADO
// ============================================================
function TooltipPersonalizado({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      {label && <p style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 11 }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || 'var(--text-primary)', marginBottom: 2 }}>
          <span style={{ opacity: 0.7 }}>{p.name}: </span>
          <strong>{formatter ? formatter(p.value, p.name) : p.value}</strong>
        </p>
      ))}
    </div>
  )
}

// ============================================================
// TARJETA KPI
// ============================================================
function KpiCard({
  label, value, unit, sub, trend, color,
}: {
  label: string
  value: string | number
  unit?: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}) {
  return (
    <div className="kpi-card" style={{ gap: 6 }}>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{
          fontSize: 26, fontWeight: 700, lineHeight: 1,
          color: color || 'var(--text-primary)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {value}
        </span>
        {unit && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{unit}</span>
        )}
      </div>
      {sub && (
        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{sub}</p>
      )}
      {trend && trend !== 'neutral' && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: trend === 'up' ? 'var(--success)' : 'var(--danger)',
        }}>
          {trend === 'up' ? '↑' : '↓'}
        </span>
      )}
    </div>
  )
}

// ============================================================
// SECCIÓN DE GRÁFICO
// ============================================================
function GraficoSection({ title, subtitle, children, height = 280 }: {
  title: string
  subtitle?: string
  children: React.ReactNode
  height?: number
}) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
        {subtitle && (
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>
        )}
      </div>
      <div style={{ height }}>{children}</div>
    </Card>
  )
}

// ============================================================
// DASHBOARD PRINCIPAL
// ============================================================
export default function DashboardPage() {
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [filtrosActivos, setFiltrosActivos] = useState<{ desde?: string; hasta?: string }>({})

  const { datos, loading, error, refetch } = useDashboard(filtrosActivos)

  function aplicarFiltros() {
    setFiltrosActivos({ desde: desde || undefined, hasta: hasta || undefined })
  }

  function limpiarFiltros() {
    setDesde(''); setHasta('')
    setFiltrosActivos({})
  }

  if (loading) {
    return (
      <div style={{ padding: 32 }}>
        <SectionHeader title="Dashboard Gerencial" subtitle="Cargando indicadores..." />
        <LoadingState message="Calculando KPIs y preparando gráficos..." />
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 32 }}>
        <SectionHeader title="Dashboard Gerencial" />
        <Card style={{ padding: 24 }}>
          <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
          <button className="btn-secondary" style={{ marginTop: 12 }} onClick={refetch}>
            Reintentar
          </button>
        </Card>
      </div>
    )
  }

  if (!datos) return null
  const { kpis, retalPorTela, retalPorProveedor, aprovechamientoMensual, rankingOperarios, rankingMesas, distribucionDestinos } = datos

  // ---- Formateadores ----
  const fmtPct = (v: number) => `${Number(v).toFixed(1)}%`
  const fmtKg  = (v: number) => `${Number(v).toFixed(2)} kg`
  const fmtM2  = (v: number) => `${Number(v).toFixed(2)} m²`
  const fmtN   = (v: number) => Number(v).toLocaleString('es-CO')

  return (
    <div style={{ padding: 32 }}>

      {/* ENCABEZADO + FILTROS DE FECHA */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard Gerencial</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
            Indicadores de aprovechamiento y economía circular del retal textil
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <div>
            <Label>Desde</Label>
            <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ width: 148 }} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ width: 148 }} />
          </div>
          <button className="btn-primary" onClick={aplicarFiltros}>Aplicar</button>
          {(filtrosActivos.desde || filtrosActivos.hasta) && (
            <button className="btn-secondary" onClick={limpiarFiltros}>Limpiar</button>
          )}
          <button className="btn-secondary" onClick={refetch} title="Actualizar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
        </div>
      </div>

      {kpis.totalCortes === 0 ? (
        <Card style={{ padding: 0 }}>
          <EmptyState message="No hay registros de corte. Comience registrando el primer corte." />
        </Card>
      ) : (
        <>
          {/* ======================================================
              FILA 1: KPIs PRINCIPALES
          ====================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            <KpiCard
              label="Total de cortes"
              value={fmtN(kpis.totalCortes)}
              sub="registros históricos"
            />
            <KpiCard
              label="Tela procesada"
              value={Number(kpis.totalTelaM2).toFixed(1)}
              unit="m²"
              sub="área total disponible"
            />
            <KpiCard
              label="Retal generado"
              value={Number(kpis.totalRetalM2).toFixed(1)}
              unit="m²"
              sub={`${Number(kpis.totalKgRetal).toFixed(2)} kg totales`}
              color="var(--warning)"
            />
            <KpiCard
              label="% Aprovechamiento"
              value={Number(kpis.avgPctAprovechamiento).toFixed(1)}
              unit="%"
              sub="promedio histórico"
              color={kpis.avgPctAprovechamiento >= 90 ? 'var(--success)' : 'var(--danger)'}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
            <KpiCard
              label="% Retal promedio"
              value={Number(kpis.avgPctRetal).toFixed(1)}
              unit="%"
              color={kpis.avgPctRetal > 12 ? 'var(--warning)' : 'var(--success)'}
            />
            <KpiCard
              label="Kg reciclables"
              value={Number(kpis.kgReciclables).toFixed(2)}
              unit="kg"
              sub="destino: reciclable"
              color="var(--success)"
            />
            <KpiCard
              label="Kg desechados"
              value={Number(kpis.kgDesechados).toFixed(2)}
              unit="kg"
              sub="destino: desechado"
              color="var(--danger)"
            />
            <KpiCard
              label="Alertas activas"
              value={kpis.totalAlertasRetal + kpis.totalAlertasAprovechamiento}
              sub={`${kpis.totalAlertasRetal} retal · ${kpis.totalAlertasAprovechamiento} aprovech.`}
              color={kpis.totalAlertasRetal + kpis.totalAlertasAprovechamiento > 0 ? 'var(--danger)' : 'var(--success)'}
            />
          </div>

          {/* ======================================================
              FILA 2: TENDENCIA MENSUAL + DISTRIBUCIÓN DESTINOS
          ====================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Gráfico 1: Aprovechamiento y retal por mes */}
            <GraficoSection
              title="Tendencia histórica mensual"
              subtitle="% Aprovechamiento vs % Retal generado por mes"
              height={300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aprovechamientoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="gradAprov" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORES.exito}    stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORES.exito}    stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRetal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORES.advertencia} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORES.advertencia} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip content={<TooltipPersonalizado formatter={(v: number) => `${v.toFixed(1)}%`} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area
                    type="monotone" dataKey="avgPctAprovechamiento"
                    name="% Aprovechamiento" stroke={COLORES.exito}
                    strokeWidth={2} fill="url(#gradAprov)"
                  />
                  <Area
                    type="monotone" dataKey="avgPctRetal"
                    name="% Retal" stroke={COLORES.advertencia}
                    strokeWidth={2} fill="url(#gradRetal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GraficoSection>

            {/* Gráfico 2: Distribución de destinos (Pie) */}
            <GraficoSection
              title="Destino del retal"
              subtitle="Distribución por kg generados"
              height={300}
            >
              {distribucionDestinos.length === 0 ? (
                <EmptyState message="Sin datos" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribucionDestinos}
                      dataKey="totalKg"
                      nameKey="destinoRetal"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      label={false}
                      labelLine={false}
                    >
                      {distribucionDestinos.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.destinoRetal === 'Reciclable' ? COLORES.exito : COLORES.advertencia}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipPersonalizado formatter={fmtKg} />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </GraficoSection>

          </div>

          {/* ======================================================
              FILA 3: RETAL POR TIPO DE TELA + POR PROVEEDOR
          ====================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Gráfico 3: Retal por tipo de tela */}
            <GraficoSection
              title="Retal por tipo de tela"
              subtitle="Kg de retal generado por material"
              height={300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={retalPorTela.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis
                    type="category"
                    dataKey="tipoTela"
                    tick={{ fontSize: 10 }}
                    width={110}
                  />
                  <Tooltip content={<TooltipPersonalizado formatter={fmtKg} />} />
                  <Bar dataKey="totalKgRetal" name="Kg retal" radius={[0, 4, 4, 0]}>
                    {retalPorTela.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={PALETA_SERIE[i % PALETA_SERIE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GraficoSection>

            {/* Gráfico 4: Retal por proveedor */}
            <GraficoSection
              title="Retal por proveedor"
              subtitle="% Retal promedio vs total de cortes"
              height={300}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={retalPorProveedor}
                  margin={{ top: 5, right: 10, left: -10, bottom: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="proveedor"
                    tick={{ fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="totalCortes" name="Cortes" fill={COLORES.primario} radius={[4,4,0,0]} />
                  <Bar dataKey="avgPctRetal"  name="% Retal"  fill={COLORES.advertencia} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </GraficoSection>

          </div>

          {/* ======================================================
              FILA 4: PRENDAS POR MES + RANKING OPERARIOS
          ====================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

            {/* Gráfico 5: Prendas producidas por mes */}
            <GraficoSection
              title="Producción mensual"
              subtitle="Total de prendas obtenidas y kg de retal por mes"
              height={280}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aprovechamientoMensual} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mesLabel" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="left"  tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line
                    yAxisId="left" type="monotone" dataKey="totalPrendas"
                    name="Prendas" stroke={COLORES.primario} strokeWidth={2}
                    dot={{ r: 3, fill: COLORES.primario }} activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="right" type="monotone" dataKey="totalKgRetal"
                    name="Kg retal" stroke={COLORES.advertencia} strokeWidth={2}
                    dot={{ r: 3, fill: COLORES.advertencia }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </GraficoSection>

            {/* Gráfico 6: Ranking de operarios */}
            <GraficoSection
              title="Ranking de operarios"
              subtitle="% Aprovechamiento promedio por operario"
              height={280}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={rankingOperarios}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <YAxis type="category" dataKey="operario" tick={{ fontSize: 10 }} width={100} />
                  <Tooltip content={<TooltipPersonalizado formatter={fmtPct} />} />
                  <Bar dataKey="avgAprovechamiento" name="% Aprovechamiento" radius={[0, 4, 4, 0]}>
                    {rankingOperarios.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.avgAprovechamiento >= 90 ? COLORES.exito : entry.avgAprovechamiento >= 80 ? COLORES.advertencia : COLORES.peligro}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </GraficoSection>

          </div>

          {/* ======================================================
              FILA 5: RANKING MESAS + TABLA RESUMEN OPERARIOS
          ====================================================== */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Gráfico 7: Ranking mesas de corte */}
            <GraficoSection
              title="Ranking mesas de corte"
              subtitle="Comparativo de aprovechamiento y retal por mesa"
              height={280}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rankingMesas} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="mesaCorte" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip content={<TooltipPersonalizado formatter={fmtPct} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgAprovechamiento" name="% Aprovechamiento" fill={COLORES.primario} radius={[4,4,0,0]} />
                  <Bar dataKey="avgPctRetal"         name="% Retal"          fill={COLORES.advertencia} radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </GraficoSection>

            {/* Tabla resumen de operarios */}
            <Card style={{ padding: 20 }}>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Detalle de operarios
                </h3>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Cortes, prendas y kg de retal por persona
                </p>
              </div>
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Operario</th>
                    <th style={{ textAlign: 'right' }}>Cortes</th>
                    <th style={{ textAlign: 'right' }}>Prendas</th>
                    <th style={{ textAlign: 'right' }}>Kg retal</th>
                    <th style={{ textAlign: 'right' }}>% Aprovech.</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingOperarios.map((op, i) => (
                    <tr key={op.operario}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{
                            width: 20, height: 20, borderRadius: '50%', fontSize: 10,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: PALETA_SERIE[i % PALETA_SERIE.length] + '33',
                            color: PALETA_SERIE[i % PALETA_SERIE.length],
                            fontWeight: 700, flexShrink: 0,
                          }}>
                            {i + 1}
                          </span>
                          <span style={{ fontSize: 12 }}>{op.operario}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{op.totalCortes}</td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>{Number(op.totalPrendas).toLocaleString('es-CO')}</td>
                      <td style={{ textAlign: 'right', fontSize: 12, fontFamily: 'monospace' }}>
                        {Number(op.totalKgRetal).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700,
                          color: op.avgAprovechamiento >= 90 ? 'var(--success)'
                               : op.avgAprovechamiento >= 80 ? 'var(--warning)'
                               : 'var(--danger)',
                        }}>
                          {Number(op.avgAprovechamiento).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

          </div>
        </>
      )}
    </div>
  )
}
