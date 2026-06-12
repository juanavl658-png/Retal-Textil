'use client'
// src/components/ui/index.tsx
// Biblioteca de componentes UI base reutilizables

import { forwardRef } from 'react'

// ============================================================
// SPINNER
// ============================================================
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 16 : size === 'lg' ? 32 : 22
  return (
    <span
      className="spinner"
      style={{ width: s, height: s, borderWidth: size === 'sm' ? 2 : 2.5 }}
    />
  )
}

// ============================================================
// LABEL
// ============================================================
export function Label({ children, required, htmlFor }: {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className="label">
      {children}
      {required && <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>}
    </label>
  )
}

// ============================================================
// INPUT
// ============================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => (
    <div style={{ width: '100%' }}>
      <input
        ref={ref}
        className={`input-base ${error ? 'border-red-500' : ''} ${className}`}
        style={error ? { borderColor: 'var(--danger)' } : {}}
        {...props}
      />
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
)
Input.displayName = 'Input'

// ============================================================
// SELECT
// ============================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
  placeholder?: string
  options: { value: string | number; label: string }[]
}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, placeholder, options, ...props }, ref) => (
    <div style={{ width: '100%' }}>
      <select
        ref={ref}
        className={`input-base ${className}`}
        style={{
          ...(error ? { borderColor: 'var(--danger)' } : {}),
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234f5d78' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: '32px',
        }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && (
        <p style={{ fontSize: '11px', color: 'var(--danger)', marginTop: 4 }}>{error}</p>
      )}
    </div>
  )
)
Select.displayName = 'Select'

// ============================================================
// BADGE
// ============================================================
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'muted'
export function Badge({ children, variant = 'blue' }: {
  children: React.ReactNode
  variant?: BadgeVariant
}) {
  const cls = {
    green: 'badge-green', red: 'badge-red',
    amber: 'badge-amber', blue: 'badge-blue',
    muted: '',
  }[variant]
  return (
    <span
      className={`badge ${cls}`}
      style={variant === 'muted' ? {
        background: 'var(--bg-surface)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border)',
      } : {}}
    >
      {children}
    </span>
  )
}

// ============================================================
// ALERT BANNER
// ============================================================
type AlertVariant = 'danger' | 'warning' | 'success' | 'info'
export function Alert({ variant, title, children }: {
  variant: AlertVariant
  title?: string
  children: React.ReactNode
}) {
  const icons = {
    danger:  '⚠',
    warning: '⚡',
    success: '✓',
    info:    'ℹ',
  }
  return (
    <div className={`alert-banner alert-${variant} animate-slide-up`}>
      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{icons[variant]}</span>
      <div>
        {title && <p style={{ fontWeight: 600, marginBottom: 2 }}>{title}</p>}
        <p style={{ opacity: 0.9 }}>{children}</p>
      </div>
    </div>
  )
}

// ============================================================
// CARD
// ============================================================
export function Card({ children, className = '', style }: {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  )
}

// ============================================================
// SECTION HEADER
// ============================================================
export function SectionHeader({ title, subtitle, actions }: {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: 16, marginBottom: 24,
    }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

// ============================================================
// EMPTY STATE
// ============================================================
export function EmptyState({ message = 'No hay datos disponibles' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px', gap: 12,
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{message}</p>
    </div>
  )
}

// ============================================================
// LOADING STATE
// ============================================================
export function LoadingState({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '48px 24px',
    }}>
      <Spinner size="sm" />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{message}</p>
    </div>
  )
}

// ============================================================
// DIVIDER
// ============================================================
export function Divider() {
  return <div className="divider" />
}

// ============================================================
// VALOR CALCULADO (campo de solo lectura con estilo especial)
// ============================================================
export function ValorCalculado({ label, value, unit, highlight }: {
  label: string
  value: string | number
  unit?: string
  highlight?: 'success' | 'warning' | 'danger' | 'neutral'
}) {
  const colors = {
    success: { bg: 'var(--success-dim)', color: 'var(--success)', border: 'rgba(16,185,129,0.2)' },
    warning: { bg: 'var(--warning-dim)', color: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
    danger:  { bg: 'var(--danger-dim)',  color: 'var(--danger)',  border: 'rgba(239,68,68,0.2)'  },
    neutral: { bg: 'var(--bg-input)',    color: 'var(--text-primary)', border: 'var(--border)'   },
  }
  const c = colors[highlight || 'neutral']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="label" style={{ margin: 0 }}>{label}</span>
      <div style={{
        padding: '8px 12px', borderRadius: 8,
        background: c.bg, border: `1.5px solid ${c.border}`,
        color: c.color, fontSize: 14, fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}{unit && <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4, opacity: 0.7 }}>{unit}</span>}
      </div>
    </div>
  )
}
