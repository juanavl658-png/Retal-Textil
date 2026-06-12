'use client'
// src/app/reportes/page.tsx

import { useState } from 'react'
import { useCatalogos } from '@/hooks/useCatalogos'
import {
  SectionHeader, Card, Select, Input, Label, Badge, LoadingState, EmptyState
} from '@/components/ui'

const TIPOS_REPORTE = [
  { value: 'operativo',      label: 'Reporte Operativo',         desc: 'Detalle completo de todos los cortes registrados' },
  { value: 'mensual',        label: 'Reporte Mensual',           desc: 'Resumen agrupado por mes con totales y promedios' },
  { value: 'proveedor',      label: 'Reporte por Proveedor',     desc: 'Comparativo de desempeño por proveedor de tela' },
  { value: 'tela',           label: 'Reporte por Tipo de Tela',  desc: 'Análisis de retal y aprovechamiento por material' },
  { value: 'sostenibilidad', label: 'Reporte de Sostenibilidad', desc: 'Economía circular: reciclables, destinos y huella' },
  { value: 'ejecutivo',      label: 'Reporte Ejecutivo',         desc: 'KPIs de alto nivel para gerencia' },
]

function fmt(n: number, dec = 2) {
  return n.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
}

export default function ReportesPage() {
  const { catalogos } = useCatalogos()
  const [tipo, setTipo]         = useState('ejecutivo')
  const [desde, setDesde]       = useState('')
  const [hasta, setHasta]       = useState('')
  const [tipoTelaId, setTipoTelaId] = useState('')
  const [proveedorId, setProveedorId] = useState('')
  const [operarioId, setOperarioId]   = useState('')
  const [datos, setDatos]       = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  async function generar() {
    setLoading(true)
    setError(null)
    setDatos(null)
    try {
      const params = new URLSearchParams({ tipo })
      if (desde)       params.set('desde', desde)
      if (hasta)       params.set('hasta', hasta)
      if (tipoTelaId)  params.set('tipoTelaId', tipoTelaId)
      if (proveedorId) params.set('proveedorId', proveedorId)
      if (operarioId)  params.set('operarioId', operarioId)

      const res  = await fetch(`/api/reportes?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setDatos(json.data)
    } catch (e: any) {
      setError(e.message || 'Error al generar el reporte')
    } finally {
      setLoading(false)
    }
  }

  function exportarCSV() {
    const params = new URLSearchParams({ formato: 'csv' })
    if (desde)       params.set('desde', desde)
    if (hasta)       params.set('hasta', hasta)
    if (tipoTelaId)  params.set('tipoTelaId', tipoTelaId)
    if (proveedorId) params.set('proveedorId', proveedorId)
    if (operarioId)  params.set('operarioId', operarioId)
    window.open(`/api/exportar?${params.toString()}`)
  }

  const tipoInfo = TIPOS_REPORTE.find(t => t.value === tipo)

  return (
    <div style={{ padding: '32px' }}>
      <SectionHeader
        title="Reportes Gerenciales"
        subtitle="Generación de informes analíticos del sistema de retal textil"
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>

        {/* PANEL DE CONFIGURACIÓN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selector de tipo */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Tipo de reporte
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {TIPOS_REPORTE.map(t => (
                <button
                  key={t.value}
                  onClick={() => { setTipo(t.value); setDatos(null) }}
                  style={{
                    textAlign: 'left', padding: '10px 12px', borderRadius: 8,
                    background: tipo === t.value ? 'var(--accent-dim)' : 'transparent',
                    border: `1.5px solid ${tipo === t.value ? 'var(--accent)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 600, color: tipo === t.value ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    {t.label}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </Card>

          {/* Filtros */}
          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Filtros
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <Label>Desde</Label>
                <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
              </div>
              <div>
                <Label>Tipo de tela</Label>
                <Select
                  value={tipoTelaId}
                  onChange={e => setTipoTelaId(e.target.value)}
                  placeholder="Todas"
                  options={(catalogos?.tiposTela || []).map(t => ({ value: t.id, label: t.nombre }))}
                />
              </div>
              <div>
                <Label>Proveedor</Label>
                <Select
                  value={proveedorId}
                  onChange={e => setProveedorId(e.target.value)}
                  placeholder="Todos"
                  options={(catalogos?.proveedores || []).map(p => ({ value: p.id, label: p.nombre }))}
                />
              </div>
              <div>
                <Label>Operario</Label>
                <Select
                  value={operarioId}
                  onChange={e => setOperarioId(e.target.value)}
                  placeholder="Todos"
                  options={(catalogos?.operarios || []).map(o => ({ value: o.id, label: o.nombre }))}
                />
              </div>
            </div>
          </Card>

          {/* Acciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn-primary" onClick={generar} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Generando...' : `Generar ${tipoInfo?.label}`}
            </button>
            <button className="btn-secondary" onClick={exportarCSV} style={{ width: '100%' }}>
              Exportar en CSV
            </button>
          </div>

        </div>

        {/* ÁREA DE RESULTADO */}
        <div>
          {loading && <Card style={{ padding: 0 }}><LoadingState message="Generando reporte..." /></Card>}

          {error && (
            <Card style={{ padding: 20 }}>
              <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
            </Card>
          )}

          {!loading && !error && !datos && (
            <Card style={{ padding: 0 }}>
              <EmptyState message="Seleccione un tipo de reporte y haga clic en Generar" />
            </Card>
          )}

          {datos && <ReporteVista datos={datos} tipo={tipo} />}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// COMPONENTE DE VISUALIZACIÓN DEL REPORTE
// ============================================================
function ReporteVista({ datos, tipo }: { datos: any; tipo: string }) {
  function fmt(n: number, dec = 2) {
    return Number(n || 0).toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  }

  const encabezado = (
    <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{datos.tipo}</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
            Generado: {new Date(datos.generado).toLocaleString('es-CO')}
            {datos.filtros?.desde && ` · Desde: ${datos.filtros.desde}`}
            {datos.filtros?.hasta && ` · Hasta: ${datos.filtros.hasta}`}
          </p>
        </div>
      </div>
    </div>
  )

  // ---- EJECUTIVO ----
  if (tipo === 'ejecutivo' && datos.kpis) {
    const k = datos.kpis
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total cortes',         val: k.totalCortes,              unit: '' },
            { label: 'Total prendas',        val: k.totalPrendas,             unit: '' },
            { label: 'Tela procesada',       val: fmt(k.totalTelaProcessadaM2), unit: 'm²' },
            { label: 'Retal generado',       val: fmt(k.totalRetalM2),        unit: 'm²' },
            { label: 'Kg de retal',          val: fmt(k.totalKgRetal, 3),     unit: 'kg' },
            { label: '% Aprovechamiento',    val: fmt(k.avgPctAprovechamiento)+'%', unit: '' },
            { label: '% Retal promedio',     val: fmt(k.avgPctRetal)+'%',     unit: '' },
            { label: '% Reciclable prom.',   val: fmt(k.avgPctReciclable)+'%',unit: '' },
            { label: 'Eficiencia operativa', val: fmt(k.eficienciaTotal)+'%', unit: '' },
          ].map(item => (
            <div key={item.label} className="kpi-card">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.val} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>{item.unit}</span>
              </p>
            </div>
          ))}
        </div>
        {datos.destacados && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="kpi-card">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mejor operario</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--success)', marginTop: 4 }}>{datos.destacados.mejorOperario}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(datos.destacados.avgAprovMejorOp)}% aprovechamiento</p>
            </div>
            <div className="kpi-card">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mejor mesa</p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--success)', marginTop: 4 }}>{datos.destacados.mejorMesa}</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(datos.destacados.avgAprovMejorMesa)}% aprovechamiento</p>
            </div>
          </div>
        )}
      </Card>
    )
  }

  // ---- MENSUAL ----
  if (tipo === 'mensual' && datos.meses) {
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>Mes</th><th>Cortes</th><th>Prendas</th>
                <th>Tela (m²)</th><th>Retal (m²)</th><th>Kg Retal</th>
                <th>% Aprovech.</th><th>% Retal</th><th>Reciclable (kg)</th><th>Desechado (kg)</th>
              </tr>
            </thead>
            <tbody>
              {datos.meses.map((m: any) => (
                <tr key={m.mes}>
                  <td style={{ fontWeight: 600 }}>{m.mes}</td>
                  <td>{m.totalCortes}</td>
                  <td>{m.totalPrendas}</td>
                  <td>{fmt(m.totalTelaM2)}</td>
                  <td>{fmt(m.totalRetalM2)}</td>
                  <td>{fmt(m.totalKgRetal, 3)}</td>
                  <td><span style={{ color: m.avgPctAprovechamiento < 90 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(m.avgPctAprovechamiento)}%</span></td>
                  <td><span style={{ color: m.avgPctRetal > 12 ? 'var(--warning)' : undefined }}>{fmt(m.avgPctRetal)}%</span></td>
                  <td style={{ color: 'var(--success)' }}>{fmt(m.kgReciclables, 3)}</td>
                  <td style={{ color: 'var(--warning)' }}>{fmt(m.kgDesechados, 3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  // ---- PROVEEDOR ----
  if (tipo === 'proveedor' && datos.proveedores) {
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr><th>Proveedor</th><th>Cortes</th><th>Prendas</th><th>Tela (m²)</th><th>Retal (m²)</th><th>Kg Retal</th><th>% Retal</th><th>% Aprovech.</th></tr>
            </thead>
            <tbody>
              {datos.proveedores.map((p: any) => (
                <tr key={p.proveedor}>
                  <td style={{ fontWeight: 600 }}>{p.proveedor}</td>
                  <td>{p.totalCortes}</td>
                  <td>{p.totalPrendas}</td>
                  <td>{fmt(p.totalTelaM2)}</td>
                  <td>{fmt(p.totalRetalM2)}</td>
                  <td>{fmt(p.totalKgRetal, 3)}</td>
                  <td>{fmt(p.avgPctRetal)}%</td>
                  <td><span style={{ color: p.avgPctAprovechamiento < 90 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(p.avgPctAprovechamiento)}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  // ---- TELA ----
  if (tipo === 'tela' && datos.telas) {
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr><th>Tipo de Tela</th><th>Composición</th><th>Cortes</th><th>Retal (m²)</th><th>Kg Retal</th><th>% Retal</th><th>% Aprovech.</th><th>% Reciclable</th></tr>
            </thead>
            <tbody>
              {datos.telas.map((t: any) => (
                <tr key={t.tipoTela}>
                  <td style={{ fontWeight: 600 }}>{t.tipoTela}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.composicion}</td>
                  <td>{t.totalCortes}</td>
                  <td>{fmt(t.totalRetalM2)}</td>
                  <td>{fmt(t.totalKgRetal, 3)}</td>
                  <td>{fmt(t.avgPctRetal)}%</td>
                  <td><span style={{ color: t.avgPctAprovechamiento < 90 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(t.avgPctAprovechamiento)}%</span></td>
                  <td><Badge variant={t.avgPctReciclable >= 60 ? 'green' : 'amber'}>{fmt(t.avgPctReciclable)}%</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    )
  }

  // ---- SOSTENIBILIDAD ----
  if (tipo === 'sostenibilidad' && datos.resumen) {
    const r = datos.resumen
    const dr = datos.destinoRetal
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total cortes',       val: r.totalCortes },
            { label: 'Tela procesada',     val: `${fmt(r.totalM2TelaProcessada)} m²` },
            { label: 'Retal generado',     val: `${fmt(r.totalKgRetalGenerado, 3)} kg` },
            { label: '% Reciclable prom.', val: `${fmt(r.avgPctReciclable)}%` },
            { label: '% Retal promedio',   val: `${fmt(r.avgPctRetal)}%` },
            { label: 'Retal en m²',        val: `${fmt(r.totalM2RetalGenerado)} m²` },
          ].map(i => (
            <div key={i.label} className="kpi-card">
              <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i.label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{i.val}</p>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="kpi-card" style={{ background: 'var(--success-dim)', borderColor: 'rgba(16,185,129,0.2)' }}>
            <p style={{ fontSize: 11, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>♻ Reciclable</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--success)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(dr.reciclable.kgTotal, 3)} kg</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(dr.reciclable.pctKg)}% del total · {dr.reciclable.cortes} cortes</p>
          </div>
          <div className="kpi-card" style={{ background: 'var(--warning-dim)', borderColor: 'rgba(245,158,11,0.2)' }}>
            <p style={{ fontSize: 11, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🗑 Desechado</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--warning)', fontFamily: 'JetBrains Mono, monospace' }}>{fmt(dr.desechado.kgTotal, 3)} kg</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{fmt(dr.desechado.pctKg)}% del total · {dr.desechado.cortes} cortes</p>
          </div>
        </div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>Por tipo de tela</h3>
        <table className="table-base">
          <thead><tr><th>Tipo de tela</th><th>Composición</th><th>Cortes</th><th>Kg Retal</th><th>% Reciclable</th></tr></thead>
          <tbody>
            {datos.porTipoTela.map((t: any) => (
              <tr key={t.tipoTela}>
                <td style={{ fontWeight: 600 }}>{t.tipoTela}</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.composicion}</td>
                <td>{t.totalCortes}</td>
                <td>{fmt(t.kgRetalGenerado, 3)}</td>
                <td><Badge variant={t.avgPctReciclable >= 60 ? 'green' : 'amber'}>{fmt(t.avgPctReciclable)}%</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    )
  }

  // ---- OPERATIVO (tabla completa) ----
  if (tipo === 'operativo' && datos.registros) {
    return (
      <Card style={{ padding: 24 }}>
        {encabezado}
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Total: <strong style={{ color: 'var(--text-primary)' }}>{datos.total}</strong> registros
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className="table-base">
            <thead>
              <tr>
                <th>ID</th><th>Fecha</th><th>Operario</th><th>Tela</th>
                <th>Prenda</th><th>Prendas</th><th>% Aprovech.</th><th>% Retal</th>
                <th>Kg Retal</th><th>Destino</th>
              </tr>
            </thead>
            <tbody>
              {datos.registros.slice(0, 200).map((r: any) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-muted)' }}>#{r.id}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(r.fecha).toLocaleDateString('es-CO')}</td>
                  <td>{r.operario}</td>
                  <td style={{ fontSize: 11 }}>{r.tipoTela}</td>
                  <td>{r.referencia} <Badge variant="muted">{r.talla}</Badge></td>
                  <td style={{ fontWeight: 600 }}>{r.totalPrendas}</td>
                  <td><span style={{ color: r.pctAprovechamiento < 90 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{fmt(r.pctAprovechamiento)}%</span></td>
                  <td><span style={{ color: r.pctRetal > 12 ? 'var(--warning)' : undefined }}>{fmt(r.pctRetal)}%</span></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{fmt(r.kgRetal, 3)}</td>
                  <td><Badge variant={r.destino === 'Reciclable' ? 'green' : 'amber'}>{r.destino}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {datos.total > 200 && (
            <p style={{ padding: '12px 12px 0', fontSize: 12, color: 'var(--text-muted)' }}>
              Mostrando 200 de {datos.total} registros. Exporta en CSV para ver todos.
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card style={{ padding: 24 }}>
      <pre style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'auto' }}>
        {JSON.stringify(datos, null, 2)}
      </pre>
    </Card>
  )
}
