'use client'
// src/app/historico/page.tsx

import { useState } from 'react'
import { useCortes } from '@/hooks/useCortes'
import { useCatalogos } from '@/hooks/useCatalogos'
import {
  SectionHeader, Card, Select, Input, Label, Badge, Spinner, EmptyState, LoadingState
} from '@/components/ui'

function formatFecha(d: string | Date) {
  return new Date(d).toLocaleDateString('es-CO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function HistoricoPage() {
  const { catalogos } = useCatalogos()

  const [filtros, setFiltros] = useState({
    page: 1, limit: 20,
    desde: '', hasta: '',
    tipoTelaId: 0, proveedorId: 0, operarioId: 0,
    referenciaPrenda: '', tallaPrenda: '', destinoRetal: '',
  })

  const { cortes, paginacion, loading, error, refetch } = useCortes(filtros)

  const set = (k: string, v: any) => setFiltros(prev => ({ ...prev, [k]: v, page: 1 }))

  async function handleEliminar(id: number) {
    if (!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return
    await fetch(`/api/cortes/${id}`, { method: 'DELETE' })
    refetch()
  }

  async function handleExportar(formato: 'csv' | 'json') {
    const params = new URLSearchParams()
    if (filtros.desde) params.set('desde', filtros.desde)
    if (filtros.hasta) params.set('hasta', filtros.hasta)
    params.set('formato', formato)
    window.open(`/api/exportar?${params.toString()}`)
  }

  return (
    <div style={{ padding: '32px' }}>
      <SectionHeader
        title="Histórico de Cortes"
        subtitle={paginacion ? `${paginacion.total} registros en total` : ''}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary" onClick={() => handleExportar('csv')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar CSV
            </button>
            <button className="btn-secondary" onClick={() => handleExportar('json')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar JSON
            </button>
          </div>
        }
      />

      {/* FILTROS */}
      <Card style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <Label>Desde</Label>
            <Input type="date" value={filtros.desde} onChange={e => set('desde', e.target.value)} />
          </div>
          <div>
            <Label>Hasta</Label>
            <Input type="date" value={filtros.hasta} onChange={e => set('hasta', e.target.value)} />
          </div>
          <div>
            <Label>Tipo de tela</Label>
            <Select
              value={filtros.tipoTelaId || ''}
              onChange={e => set('tipoTelaId', parseInt(e.target.value) || 0)}
              placeholder="Todas"
              options={(catalogos?.tiposTela || []).map(t => ({ value: t.id, label: t.nombre }))}
            />
          </div>
          <div>
            <Label>Proveedor</Label>
            <Select
              value={filtros.proveedorId || ''}
              onChange={e => set('proveedorId', parseInt(e.target.value) || 0)}
              placeholder="Todos"
              options={(catalogos?.proveedores || []).map(p => ({ value: p.id, label: p.nombre }))}
            />
          </div>
          <div>
            <Label>Operario</Label>
            <Select
              value={filtros.operarioId || ''}
              onChange={e => set('operarioId', parseInt(e.target.value) || 0)}
              placeholder="Todos"
              options={(catalogos?.operarios || []).map(o => ({ value: o.id, label: o.nombre }))}
            />
          </div>
          <div>
            <Label>Referencia</Label>
            <Select
              value={filtros.referenciaPrenda}
              onChange={e => set('referenciaPrenda', e.target.value)}
              placeholder="Todas"
              options={['Camisa', 'Pantalon', 'Buso', 'Chaqueta'].map(r => ({ value: r, label: r }))}
            />
          </div>
          <div>
            <Label>Destino</Label>
            <Select
              value={filtros.destinoRetal}
              onChange={e => set('destinoRetal', e.target.value)}
              placeholder="Todos"
              options={[{ value: 'Reciclable', label: 'Reciclable' }, { value: 'Desechado', label: 'Desechado' }]}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setFiltros({ page: 1, limit: 20, desde: '', hasta: '', tipoTelaId: 0, proveedorId: 0, operarioId: 0, referenciaPrenda: '', tallaPrenda: '', destinoRetal: '' })}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </Card>

      {/* TABLA */}
      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div style={{ padding: 24 }}>
            <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>
          </div>
        ) : cortes.length === 0 ? (
          <EmptyState message="No se encontraron registros con los filtros seleccionados" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table-base">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Mesa</th>
                  <th>Operario</th>
                  <th>Tipo de Tela</th>
                  <th>Lote</th>
                  <th>Prenda / Talla</th>
                  <th>Prendas</th>
                  <th>% Aprovech.</th>
                  <th>% Retal</th>
                  <th>Kg Retal</th>
                  <th>Destino</th>
                  <th>Alertas</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cortes.map(c => (
                  <tr key={c.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 11 }}>#{c.id}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatFecha(c.fechaCorte)}</td>
                    <td>{c.mesaCorte.nombre}</td>
                    <td>{c.operario.nombre}</td>
                    <td style={{ maxWidth: 140 }}>
                      <span style={{ fontSize: 12 }}>{c.tipoTela.nombre}</span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{c.loteTela}</td>
                    <td>
                      <span>{c.referenciaPrenda}</span>
                      <span style={{ marginLeft: 4 }}>
                        <Badge variant="muted">{c.tallaPrenda}</Badge>
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.totalPrendas}</td>
                    <td>
                      <span style={{ color: c.alertaAprovechamiento ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                        {Number(c.pctAprovechamiento).toFixed(1)}%
                      </span>
                    </td>
                    <td>
                      <span style={{ color: c.alertaRetal ? 'var(--warning)' : 'var(--text-secondary)' }}>
                        {Number(c.pctRetal).toFixed(1)}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{Number(c.kgRetalGenerado).toFixed(3)}</td>
                    <td>
                      <Badge variant={c.destinoRetal === 'Reciclable' ? 'green' : 'amber'}>
                        {c.destinoRetal}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {c.alertaAprovechamiento && <Badge variant="red">Aprov.</Badge>}
                        {c.alertaRetal && <Badge variant="amber">Retal</Badge>}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        style={{ padding: '4px 8px', fontSize: 11 }}
                        onClick={() => handleEliminar(c.id)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINACIÓN */}
        {paginacion && paginacion.totalPages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 16px 0', borderTop: '1px solid var(--border)', marginTop: 8,
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Página {paginacion.page} de {paginacion.totalPages} — {paginacion.total} registros
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={paginacion.page <= 1}
                onClick={() => setFiltros(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                ← Anterior
              </button>
              <button
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: 12 }}
                disabled={paginacion.page >= paginacion.totalPages}
                onClick={() => setFiltros(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
