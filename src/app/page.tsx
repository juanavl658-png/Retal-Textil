'use client'
// src/app/page.tsx
// Formulario principal de registro de corte de tela

import { useState, useEffect, useCallback } from 'react'
import {
  Input, Select, Label, Alert, Spinner, ValorCalculado, Card, SectionHeader, Divider
} from '@/components/ui'
import { useCatalogos } from '@/hooks/useCatalogos'
import { useCalculos } from '@/hooks/useCalculos'
import { DEPARTAMENTOS, DEPARTAMENTO_HABILITADO, TALLAS, REFERENCIAS_PRENDA } from '@/lib/constantes'

const LINEAS_OPCIONES = Array.from({ length: 100 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}))

const CAMPOS_VACIOS = {
  fechaCorte: '',
  departamento: '',
  mesaCorteId: '',
  operarioId: '',
  tipoTelaId: '',
  proveedorId: '',
  loteTela: '',
  referenciaPrenda: '',
  tallaPrenda: '',
  largoTelaM: '',
  anchoTelaM: '',
  lineasTela: '1',
  gramajeGm2: '',
}

export default function FormularioCorte() {
  const { catalogos, loading: loadingCatalogos } = useCatalogos()
  const { resultados, calculando, calcular, limpiar } = useCalculos()

  const [form, setForm]           = useState<Record<string, string>>(CAMPOS_VACIOS)
  const [enviando, setEnviando]   = useState(false)
  const [exito, setExito]         = useState(false)
  const [errorApi, setErrorApi]   = useState<string | null>(null)
  const [errores, setErrores]     = useState<Record<string, string>>({})

  const departamentoHabilitado = form.departamento === DEPARTAMENTO_HABILITADO
  const bloqueado = form.departamento !== '' && !departamentoHabilitado

  // Autocompletar ancho y gramaje al seleccionar tipo de tela
  useEffect(() => {
    if (!form.tipoTelaId || !catalogos) return
    const tela = catalogos.tiposTela.find(t => String(t.id) === form.tipoTelaId)
    if (tela) {
      const gramajeProm = Math.round((tela.gramajeMin + tela.gramajeMax) / 2)
      setForm(prev => ({
        ...prev,
        anchoTelaM: String(parseFloat(String(tela.anchoUtil))),
        gramajeGm2: String(gramajeProm),
      }))
    }
  }, [form.tipoTelaId, catalogos])

  // Calcular en tiempo real cuando los campos clave cambian
  useEffect(() => {
    if (
      departamentoHabilitado &&
      form.referenciaPrenda && form.tallaPrenda &&
      form.largoTelaM && form.anchoTelaM &&
      form.lineasTela && form.tipoTelaId
    ) {
      calcular({
        referenciaPrenda: form.referenciaPrenda,
        tallaPrenda:      form.tallaPrenda,
        largoTelaM:       parseFloat(form.largoTelaM),
        anchoTelaM:       parseFloat(form.anchoTelaM),
        lineasTela:       parseInt(form.lineasTela),
        tipoTelaId:       parseInt(form.tipoTelaId),
        gramajeGm2:       parseInt(form.gramajeGm2),
      })
    } else {
      limpiar()
    }
  }, [
    form.referenciaPrenda, form.tallaPrenda, form.largoTelaM,
    form.anchoTelaM, form.lineasTela, form.tipoTelaId,
    form.gramajeGm2, departamentoHabilitado,
  ])

  const set = useCallback((campo: string, valor: string) => {
    setForm(prev => ({ ...prev, [campo]: valor }))
    setErrores(prev => ({ ...prev, [campo]: '' }))
    setExito(false)
    setErrorApi(null)
  }, [])

  function validar(): boolean {
    const errs: Record<string, string> = {}
    if (!form.fechaCorte)       errs.fechaCorte      = 'Requerido'
    if (!form.departamento)     errs.departamento    = 'Requerido'
    if (!form.mesaCorteId)      errs.mesaCorteId     = 'Requerido'
    if (!form.operarioId)       errs.operarioId      = 'Requerido'
    if (!form.tipoTelaId)       errs.tipoTelaId      = 'Requerido'
    if (!form.proveedorId)      errs.proveedorId     = 'Requerido'
    if (!form.loteTela.trim())  errs.loteTela        = 'Requerido'
    if (!form.referenciaPrenda) errs.referenciaPrenda= 'Requerido'
    if (!form.tallaPrenda)      errs.tallaPrenda     = 'Requerido'
    if (!form.largoTelaM || parseFloat(form.largoTelaM) <= 0) errs.largoTelaM = 'Debe ser mayor a 0'
    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    setEnviando(true)
    setErrorApi(null)

    try {
      const res = await fetch('/api/cortes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          mesaCorteId:  parseInt(form.mesaCorteId),
          operarioId:   parseInt(form.operarioId),
          tipoTelaId:   parseInt(form.tipoTelaId),
          proveedorId:  parseInt(form.proveedorId),
          largoTelaM:   parseFloat(form.largoTelaM),
          anchoTelaM:   parseFloat(form.anchoTelaM),
          lineasTela:   parseInt(form.lineasTela),
          gramajeGm2:   parseInt(form.gramajeGm2),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setErrorApi(json.error || 'Error al registrar el corte')
        return
      }

      setExito(true)
      setForm(CAMPOS_VACIOS)
      limpiar()
      setTimeout(() => setExito(false), 5000)
    } catch {
      setErrorApi('Error de conexión. Verifique su internet e intente nuevamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (loadingCatalogos) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner size="lg" />
          <p style={{ color: 'var(--text-muted)', marginTop: 12, fontSize: 13 }}>Cargando formulario...</p>
        </div>
      </div>
    )
  }

  const telaSeleccionada = catalogos?.tiposTela.find(t => String(t.id) === form.tipoTelaId)

  return (
    <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>
      <SectionHeader
        title="Registro de Corte"
        subtitle="Complete todos los campos para registrar un nuevo proceso de corte"
      />

      {/* Alerta de departamento bloqueado */}
      {bloqueado && (
        <div style={{ marginBottom: 24 }}>
          <Alert variant="danger" title="Acceso restringido">
            Usted no posee los permisos suficientes para continuar
          </Alert>
        </div>
      )}

      {/* Éxito */}
      {exito && (
        <div style={{ marginBottom: 24 }}>
          <Alert variant="success" title="Corte registrado exitosamente">
            Los indicadores han sido calculados y almacenados en el sistema.
          </Alert>
        </div>
      )}

      {/* Error de API */}
      {errorApi && (
        <div style={{ marginBottom: 24 }}>
          <Alert variant="danger">{errorApi}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ---- COLUMNA IZQUIERDA: Formulario ---- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* SECCIÓN 1: Identificación del corte */}
            <Card style={{ padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                Identificación
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div>
                  <Label htmlFor="fechaCorte" required>Fecha de corte</Label>
                  <Input
                    id="fechaCorte"
                    type="date"
                    value={form.fechaCorte}
                    onChange={e => set('fechaCorte', e.target.value)}
                    error={errores.fechaCorte}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div>
                  <Label htmlFor="departamento" required>Departamento</Label>
                  <Select
                    id="departamento"
                    value={form.departamento}
                    onChange={e => set('departamento', e.target.value)}
                    error={errores.departamento}
                    placeholder="Seleccionar..."
                    options={DEPARTAMENTOS.map(d => ({ value: d, label: d }))}
                  />
                </div>

                <div>
                  <Label htmlFor="mesaCorteId" required>Mesa de corte</Label>
                  <Select
                    id="mesaCorteId"
                    value={form.mesaCorteId}
                    onChange={e => set('mesaCorteId', e.target.value)}
                    error={errores.mesaCorteId}
                    placeholder="Seleccionar..."
                    disabled={bloqueado}
                    options={(catalogos?.mesas || []).map(m => ({ value: m.id, label: m.nombre }))}
                  />
                </div>

                <div>
                  <Label htmlFor="operarioId" required>Operario responsable</Label>
                  <Select
                    id="operarioId"
                    value={form.operarioId}
                    onChange={e => set('operarioId', e.target.value)}
                    error={errores.operarioId}
                    placeholder="Seleccionar..."
                    disabled={bloqueado}
                    options={(catalogos?.operarios || []).map(o => ({ value: o.id, label: o.nombre }))}
                  />
                </div>

              </div>
            </Card>

            {/* SECCIÓN 2: Tela */}
            <Card style={{ padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                Tela
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div style={{ gridColumn: '1 / -1' }}>
                  <Label htmlFor="tipoTelaId" required>Tipo de tela</Label>
                  <Select
                    id="tipoTelaId"
                    value={form.tipoTelaId}
                    onChange={e => set('tipoTelaId', e.target.value)}
                    error={errores.tipoTelaId}
                    placeholder="Seleccionar tipo de tela..."
                    disabled={bloqueado}
                    options={(catalogos?.tiposTela || []).map(t => ({ value: t.id, label: t.nombre }))}
                  />
                  {telaSeleccionada && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      Composición: <span style={{ color: 'var(--accent-light)' }}>{telaSeleccionada.composicion}</span>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="proveedorId" required>Proveedor de tela</Label>
                  <Select
                    id="proveedorId"
                    value={form.proveedorId}
                    onChange={e => set('proveedorId', e.target.value)}
                    error={errores.proveedorId}
                    placeholder="Seleccionar..."
                    disabled={bloqueado}
                    options={(catalogos?.proveedores || []).map(p => ({ value: p.id, label: p.nombre }))}
                  />
                </div>

                <div>
                  <Label htmlFor="loteTela" required>Lote de tela</Label>
                  <Input
                    id="loteTela"
                    type="text"
                    placeholder="Ej: LOT-2024-001"
                    value={form.loteTela}
                    onChange={e => set('loteTela', e.target.value)}
                    error={errores.loteTela}
                    disabled={bloqueado}
                  />
                </div>

                <div>
                  <Label htmlFor="largoTelaM" required>Largo de tela (m)</Label>
                  <Input
                    id="largoTelaM"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ej: 10.50"
                    value={form.largoTelaM}
                    onChange={e => set('largoTelaM', e.target.value)}
                    error={errores.largoTelaM}
                    disabled={bloqueado}
                  />
                </div>

                <div>
                  <Label htmlFor="anchoTelaM">Ancho de tela (m)</Label>
                  <Input
                    id="anchoTelaM"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Autocompletado"
                    value={form.anchoTelaM}
                    onChange={e => set('anchoTelaM', e.target.value)}
                    disabled={bloqueado}
                  />
                  {form.tipoTelaId && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      ← Autocompletado del catálogo
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gramajeGm2">Gramaje (g/m²)</Label>
                  <Input
                    id="gramajeGm2"
                    type="number"
                    min="1"
                    placeholder="Autocompletado"
                    value={form.gramajeGm2}
                    onChange={e => set('gramajeGm2', e.target.value)}
                    disabled={bloqueado}
                  />
                </div>

                <div>
                  <Label htmlFor="lineasTela" required>Líneas de tela</Label>
                  <Select
                    id="lineasTela"
                    value={form.lineasTela}
                    onChange={e => set('lineasTela', e.target.value)}
                    disabled={bloqueado}
                    options={LINEAS_OPCIONES}
                  />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                    Capas apiladas para el corte
                  </p>
                </div>

              </div>
            </Card>

            {/* SECCIÓN 3: Prenda */}
            <Card style={{ padding: 24 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>
                Prenda
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div>
                  <Label htmlFor="referenciaPrenda" required>Referencia de prenda</Label>
                  <Select
                    id="referenciaPrenda"
                    value={form.referenciaPrenda}
                    onChange={e => set('referenciaPrenda', e.target.value)}
                    error={errores.referenciaPrenda}
                    placeholder="Seleccionar..."
                    disabled={bloqueado}
                    options={REFERENCIAS_PRENDA.map(r => ({ value: r, label: r }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tallaPrenda" required>Talla de prenda</Label>
                  <Select
                    id="tallaPrenda"
                    value={form.tallaPrenda}
                    onChange={e => set('tallaPrenda', e.target.value)}
                    error={errores.tallaPrenda}
                    placeholder="Seleccionar..."
                    disabled={bloqueado}
                    options={TALLAS.map(t => ({ value: t, label: t }))}
                  />
                </div>

              </div>
            </Card>

            {/* BOTÓN ENVIAR */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setForm(CAMPOS_VACIOS); limpiar(); setErrores({}); }}
                disabled={enviando}
              >
                Limpiar formulario
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={enviando || bloqueado || !departamentoHabilitado}
                style={{ minWidth: 160 }}
              >
                {enviando ? (
                  <><Spinner size="sm" /> Registrando...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                    Registrar Corte
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ---- COLUMNA DERECHA: Indicadores calculados ---- */}
          <div style={{ position: 'sticky', top: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Card style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Indicadores
                </h2>
                {calculando && <Spinner size="sm" />}
              </div>

              {!resultados ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.6 }}>
                    Complete los campos de tela y prenda para ver los indicadores calculados en tiempo real.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  <ValorCalculado
                    label="Área de prenda"
                    value={resultados.areaPrendaM2.toFixed(3)}
                    unit="m²"
                  />
                  <ValorCalculado
                    label="Área total disponible"
                    value={resultados.areaTotalDisponibleM2.toFixed(3)}
                    unit="m²"
                  />
                  <ValorCalculado
                    label="Prendas por línea"
                    value={resultados.prendasPorLinea}
                    unit="und"
                  />
                  <ValorCalculado
                    label="Total de prendas"
                    value={resultados.totalPrendas}
                    unit="und"
                    highlight="success"
                  />

                  <Divider />

                  <ValorCalculado
                    label="Retal generado"
                    value={resultados.retalGeneradoM2.toFixed(3)}
                    unit="m²"
                  />
                  <ValorCalculado
                    label="% Aprovechamiento"
                    value={`${resultados.pctAprovechamiento.toFixed(1)}%`}
                    highlight={resultados.alertaAprovechamiento ? 'danger' : 'success'}
                  />
                  <ValorCalculado
                    label="% Retal generado"
                    value={`${resultados.pctRetal.toFixed(1)}%`}
                    highlight={resultados.alertaRetal ? 'warning' : 'neutral'}
                  />
                  <ValorCalculado
                    label="Kg de retal"
                    value={resultados.kgRetalGenerado.toFixed(3)}
                    unit="kg"
                  />
                  <ValorCalculado
                    label="% Potencialmente reciclable"
                    value={`${resultados.pctReciclable}%`}
                    highlight={resultados.pctReciclable >= 60 ? 'success' : 'warning'}
                  />

                  <Divider />

                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: resultados.destinoRetal === 'Reciclable' ? 'var(--success-dim)' : 'var(--warning-dim)',
                    border: `1px solid ${resultados.destinoRetal === 'Reciclable' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Destino del retal</span>
                    <span style={{
                      fontSize: 12, fontWeight: 700,
                      color: resultados.destinoRetal === 'Reciclable' ? 'var(--success)' : 'var(--warning)',
                    }}>
                      {resultados.destinoRetal}
                    </span>
                  </div>

                </div>
              )}
            </Card>

            {/* Alertas activas */}
            {resultados?.alertaAprovechamiento && (
              <Alert variant="danger" title="Aprovechamiento bajo">
                El aprovechamiento ({resultados.pctAprovechamiento.toFixed(1)}%) está por debajo del mínimo requerido (90%).
              </Alert>
            )}
            {resultados?.alertaRetal && (
              <Alert variant="warning" title="Retal elevado">
                El retal generado ({resultados.pctRetal.toFixed(1)}%) supera el límite permitido (12%).
              </Alert>
            )}

          </div>
        </div>
      </form>
    </div>
  )
}
