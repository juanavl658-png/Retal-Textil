# FASE 1 — Levantamiento de Requerimientos, Arquitectura y Modelo de Datos
## Sistema de Gestión de Retal Textil — Economía Circular

> **Empresa:** Sector moda, Medellín, Colombia
> **Versión:** 1.0
> **Fecha:** Junio 2026

---

## 1. DIAGNÓSTICO DEL ARCHIVO EXCEL

### 1.1 Hojas Identificadas

| Hoja | Contenido |
|------|-----------|
| Hoja1 | Variables del formulario, catálogos, reglas de negocio, variables calculadas y de salida |
| Hoja2 | Catálogo maestro de telas: tipo, largo, ancho útil y gramaje |

### 1.2 Catálogos Identificados

#### Departamentos
| Valor | Permite registro |
|-------|-----------------|
| Corte | ✅ SÍ |
| Almacen | ❌ NO |
| inventario | ❌ NO |

#### Mesas de corte
`Mesa 1` · `Mesa 2` · `Mesa 3`

#### Operarios responsables
`Camila Patiño` · `Juana Vergara` · `Daniela Salazar` · `German Cano` · `Leonel Armando` · `Jaime Bolivar` · `Oscar Lopera`

#### Referencias de prenda
`Camisa` · `Pantalon` · `Buso` · `Chaqueta`

#### Tallas de prenda
`S` · `M` · `L` · `XL`

#### Líneas de tela
Rango numérico del `1` al `100`

#### Destino final del retal
`Reciclable` · `Desechado`

### 1.3 Catálogo Maestro de Telas (Hoja2)

| Tipo de Tela | Largo base | Ancho útil | Gramaje |
|---|---|---|---|
| Algodón jersey 100% | 1 m | 1.80 m | 180 g/m² |
| Algodón jersey pesado | 1 m | 1.80 m | 220 g/m² |
| Burda perchada | 1 m | 1.80 m | 280 g/m² |
| French Terry | 1 m | 1.80 m | 260 g/m² |
| Piqué polo | 1 m | 1.70 m | 220 g/m² |
| Drill liviano | 1 m | 1.50 m | 240 g/m² |
| Drill pesado | 1 m | 1.50 m | 320 g/m² |
| Denim (jean) | 1 m | 1.50 m | 400–450 g/m² |
| Poliéster deportivo | 1 m | 1.60 m | 140–160 g/m² |
| Softshell | 1 m | 1.50 m | 300 g/m² |

> **Nota:** El largo de 1 m en la hoja es el largo de referencia por metro lineal. El usuario ingresará cuántos metros tiene el rollo/paño real (`Largo tela`). El ancho y gramaje se autocompletarán al seleccionar el tipo de tela.

### 1.4 Tabla de Área de Prenda por Referencia y Talla (m²)

| Prenda | S | M | L | XL |
|--------|---|---|---|----|
| Camisa | 0.40 | 0.42 | 0.45 | 0.48 |
| Pantalon | 0.95 | 1.05 | 1.15 | 1.25 |
| Buso | 0.68 | 0.76 | 0.81 | 0.85 |
| Chaqueta | 0.87 | 0.98 | 1.08 | 1.16 |

---

## 2. VARIABLES DE ENTRADA — DEFINICIÓN COMPLETA

| Variable | Tipo | Fuente | Observación |
|----------|------|--------|-------------|
| Fecha de corte | Fecha (date) | Manual | Requerido |
| Departamento | Lista desplegable | Catálogo | Gatilla regla excluyente |
| Mesa de corte | Lista desplegable | Catálogo | Mesa 1, 2 o 3 |
| Operario responsable | Lista desplegable | Catálogo | 7 operarios |
| Tipo de tela | Lista desplegable | Hoja 2 | Autocompletará ancho y gramaje |
| Composición textil | Lista desplegable | Derivado de tipo de tela | Ej: "100% Algodón", "Poliéster" |
| Proveedor de tela | Lista desplegable | Catálogo independiente | Se construye desde la app |
| Lote de tela | Texto libre | Manual | Identificador único del lote |
| Referencia de prenda | Lista desplegable | Catálogo | Camisa/Pantalon/Buso/Chaqueta |
| Talla de prenda | Lista desplegable | Catálogo | S/M/L/XL |
| Área de prenda | Calculado | Referencia + Talla | No editable por el usuario |
| Largo tela | Numérico (m) | Hoja 2 / manual | Metros lineales del paño |
| Ancho tela | Numérico (m) | Hoja 2 / autocompletado | Según tipo de tela seleccionado |
| Líneas de tela | Numérico (1–100) | Manual / lista | Capas de tela apiladas para el corte |
| Gramaje de tela | Numérico (g/m²) | Hoja 2 / autocompletado | Según tipo de tela seleccionado |

---

## 3. REGLAS DE NEGOCIO

### RN-01 — Regla Excluyente por Departamento
```
SI Departamento ≠ "Corte"
  ENTONCES:
    - Deshabilitar todos los campos del formulario
    - Mostrar alerta: "Usted no posee los permisos suficientes para continuar"
    - No permitir envío del formulario
```

### RN-02 — Autocompletado por Tipo de Tela
```
Al seleccionar Tipo de Tela:
  - Ancho tela ← Hoja2[tipo_tela].ancho_util
  - Gramaje ← Hoja2[tipo_tela].gramaje
  - Composición textil ← inferida del nombre del tipo de tela
```

### RN-03 — Cálculo de Área de Prenda
```
Área de prenda = TABLA[Referencia de prenda][Talla de prenda]
(Valor autocompletado, no editable)
```

### RN-04 — Cálculo de Consumo de Tela
```
Área total disponible (m²)  = Largo tela × Ancho tela
Prendas por línea           = FLOOR(Área total disponible / Área de prenda)
Total prendas               = Prendas por línea × Líneas de tela
Área consumida (m²)         = Total prendas × Área de prenda
Consumo por línea (m²)      = Prendas por línea × Área de prenda
```

### RN-05 — Cálculo de Retal Generado
```
Retal generado (m²)         = Área total disponible - Área consumida
                            = (Largo × Ancho) - (Total prendas × Área de prenda)
```

### RN-06 — Variables de Salida y sus Fórmulas
```
% Retal generado            = (Retal generado / Área total disponible) × 100
% Aprovechamiento           = (Área consumida / Área total disponible) × 100
Número de prendas           = Total prendas (ver RN-04)
% Reciclable                = f(Composición textil)  — ver RN-07
% Desperdicio por tela      = % Retal generado (agrupado por tipo de tela en reportes)
Número de lotes registrados = COUNT(lote_tela) en histórico
Destino del retal           = "Reciclable" si % reciclable ≥ umbral, si no "Desechado"
Kg de retal generado        = Retal generado (m²) × Gramaje (g/m²) / 1000
```

### RN-07 — Porcentaje Potencialmente Reciclable por Composición Textil
```
100% Algodón            → 95% reciclable
100% Poliéster          → 70% reciclable
Mezcla Algodón/Poliéster → 50% reciclable
Lana / Burda            → 80% reciclable
French Terry            → 85% reciclable
Denim                   → 60% reciclable
Softshell               → 40% reciclable
Otros / No especificado → 30% reciclable
```

### RN-08 — Alertas Operativas
```
ALERTA RETAL:
  SI % Retal generado > 12%
    → Mostrar alerta naranja: "Retal por encima del límite (>12%). Revisar proceso."

ALERTA APROVECHAMIENTO:
  SI % Aprovechamiento < 90%
    → Mostrar alerta roja: "Aprovechamiento por debajo del mínimo (<90%). Acción requerida."
```

### RN-09 — Destino Final del Retal
```
SI % Reciclable ≥ 60%  → Destino = "Reciclable"
SI % Reciclable < 60%  → Destino = "Desechado"
```

---

## 4. SUPUESTOS DEL PROYECTO

| ID | Supuesto |
|----|----------|
| S-01 | El largo de tela ingresado es el largo real del paño que se va a cortar (en metros). |
| S-02 | El ancho de la Hoja2 es el ancho estándar del tipo de tela; el usuario puede sobrescribirlo si el proveedor entrega medidas distintas. |
| S-03 | Las líneas de tela representan capas apiladas; multiplican el número de prendas (no el área de la tela). |
| S-04 | El gramaje con rango (ej: 400–450 g/m²) se almacena como valor promedio en la base de datos. |
| S-05 | Los proveedores de tela se gestionan como un catálogo administrable desde la misma aplicación. |
| S-06 | No existe autenticación; cualquier persona con acceso a la URL puede usar la app. |
| S-07 | El porcentaje reciclable es un estimado basado en la composición textil, no una medición física. |
| S-08 | Un "corte" es un registro único por formulario diligenciado (una referencia, una talla, un paño). |

---

## 5. RIESGOS IDENTIFICADOS

| ID | Riesgo | Impacto | Mitigación |
|----|--------|---------|------------|
| R-01 | Datos inconsistentes por ausencia de login | Alto | Validaciones estrictas de formulario + regla excluyente por departamento |
| R-02 | Gramaje con rango variable (400–450) dificulta cálculo de Kg exactos | Medio | Usar promedio del rango; documentar limitación |
| R-03 | El ancho real puede diferir del catálogo | Medio | Permitir edición del campo ancho si es necesario |
| R-04 | Crecimiento de datos sin control de acceso | Medio | Exportación y backups periódicos; índices en DB |
| R-05 | Dependencia de Supabase/Vercel tier gratuito | Bajo | Documentar límites; arquitectura migrable |

---

## 6. ARQUITECTURA DE SOLUCIÓN RECOMENDADA

### 6.1 Stack Tecnológico Seleccionado y Justificación

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | SSR/SSG gratuito en Vercel, tipado seguro, componentes reutilizables |
| Backend | Next.js API Routes (Node.js) | Elimina la necesidad de un servidor separado; reduce complejidad de despliegue |
| Base de datos | PostgreSQL vía Supabase | Tier gratuito generoso (500 MB), autobeckup, API REST, panel visual |
| ORM | Prisma | Migraciones versionadas, type-safety, compatible con PostgreSQL |
| Dashboard | Recharts | Librería React, sin costo, flexible, compatible con Next.js |
| Despliegue | Vercel (frontend + API) + Supabase (DB) | 100% gratuito, CI/CD automático desde GitHub |

> **Decisión clave:** Se usa Next.js como monorepo (frontend + backend en el mismo repositorio), evitando un backend Node/Express separado. Esto simplifica el despliegue a un solo servicio en Vercel.

### 6.2 Diagrama de Arquitectura

```
┌──────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                             │
│                     (Navegador web)                              │
└─────────────────────────────┬────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    VERCEL (Free Tier)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Next.js 14 App                              │    │
│  │  ┌─────────────────┐    ┌──────────────────────────┐   │    │
│  │  │  Frontend (React)│    │   API Routes (/api/*)    │   │    │
│  │  │  - Formulario    │    │   - /api/cortes          │   │    │
│  │  │  - Dashboard     │    │   - /api/reportes        │   │    │
│  │  │  - Reportes      │◄──►│   - /api/catalogos       │   │    │
│  │  │  - Exportación   │    │   - /api/dashboard       │   │    │
│  │  └─────────────────┘    └──────────┬───────────────┘   │    │
│  └─────────────────────────────────────┼───────────────────┘    │
└────────────────────────────────────────┼────────────────────────┘
                                         │ Prisma Client (TCP)
                                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                  SUPABASE (Free Tier)                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              PostgreSQL 15                               │    │
│  │  - cortes           - tipo_telas                        │    │
│  │  - proveedores      - referencias_prendas               │    │
│  │  - operarios        - mesas_corte                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Estructura de Carpetas del Proyecto

```
retal-textil/
├── prisma/
│   ├── schema.prisma          # Modelo de datos
│   └── migrations/            # Migraciones versionadas
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Formulario principal (ruta /)
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Dashboard gerencial
│   │   ├── reportes/
│   │   │   └── page.tsx       # Módulo de reportes
│   │   └── api/
│   │       ├── cortes/
│   │       │   ├── route.ts   # GET (listar) / POST (crear)
│   │       │   └── [id]/
│   │       │       └── route.ts  # GET / PUT / DELETE por ID
│   │       ├── catalogos/
│   │       │   └── route.ts   # Catálogos: telas, operarios, etc.
│   │       ├── dashboard/
│   │       │   └── route.ts   # KPIs y datos de gráficos
│   │       └── reportes/
│   │           └── route.ts   # Generación de reportes
│   ├── components/
│   │   ├── ui/                # Componentes base (Button, Input, Select…)
│   │   ├── formulario/        # Componentes del formulario de corte
│   │   ├── dashboard/         # Tarjetas KPI y gráficos
│   │   └── reportes/          # Tablas y exportadores
│   ├── lib/
│   │   ├── prisma.ts          # Instancia singleton de Prisma
│   │   ├── calculos.ts        # Toda la lógica de negocio / fórmulas
│   │   └── constantes.ts      # Catálogos estáticos, tablas de área
│   └── types/
│       └── index.ts           # Tipos TypeScript globales
├── public/
│   └── logo.svg
├── .env.local                 # Variables de entorno (no commitear)
├── .env.example               # Plantilla de variables de entorno
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

---

## 7. MODELO DE DATOS

### 7.1 Tablas de la Base de Datos

#### `tipo_telas` — Catálogo maestro de telas
```sql
- id            SERIAL PRIMARY KEY
- nombre        VARCHAR(100) UNIQUE NOT NULL   -- Ej: "Algodón jersey 100%"
- composicion   VARCHAR(100)                   -- Ej: "100% Algodón"
- ancho_util    DECIMAL(5,2) NOT NULL          -- Metros (Ej: 1.80)
- gramaje_min   INTEGER NOT NULL               -- g/m² mínimo
- gramaje_max   INTEGER NOT NULL               -- g/m² máximo (= min si es exacto)
- created_at    TIMESTAMPTZ DEFAULT NOW()
```

#### `proveedores` — Catálogo de proveedores de tela
```sql
- id            SERIAL PRIMARY KEY
- nombre        VARCHAR(150) UNIQUE NOT NULL
- activo        BOOLEAN DEFAULT true
- created_at    TIMESTAMPTZ DEFAULT NOW()
```

#### `operarios` — Catálogo de operarios
```sql
- id            SERIAL PRIMARY KEY
- nombre        VARCHAR(150) UNIQUE NOT NULL
- activo        BOOLEAN DEFAULT true
- created_at    TIMESTAMPTZ DEFAULT NOW()
```

#### `mesas_corte` — Catálogo de mesas
```sql
- id            SERIAL PRIMARY KEY
- nombre        VARCHAR(50) UNIQUE NOT NULL    -- "Mesa 1", "Mesa 2", "Mesa 3"
- activo        BOOLEAN DEFAULT true
```

#### `referencias_prendas` — Catálogo de referencias y áreas
```sql
- id            SERIAL PRIMARY KEY
- nombre        VARCHAR(100) NOT NULL           -- "Camisa", "Pantalon"…
- talla         VARCHAR(5) NOT NULL             -- "S", "M", "L", "XL"
- area_m2       DECIMAL(5,3) NOT NULL           -- m² de la prenda
- UNIQUE(nombre, talla)
```

#### `cortes` — Tabla principal de registros
```sql
-- DATOS DE ENTRADA
- id                        SERIAL PRIMARY KEY
- fecha_corte               DATE NOT NULL
- departamento              VARCHAR(50) NOT NULL
- mesa_corte_id             INTEGER REFERENCES mesas_corte(id)
- operario_id               INTEGER REFERENCES operarios(id)
- tipo_tela_id              INTEGER REFERENCES tipo_telas(id)
- proveedor_id              INTEGER REFERENCES proveedores(id)
- lote_tela                 VARCHAR(100)
- referencia_prenda         VARCHAR(50) NOT NULL
- talla_prenda              VARCHAR(5) NOT NULL
- largo_tela_m              DECIMAL(8,2) NOT NULL      -- metros
- ancho_tela_m              DECIMAL(5,2) NOT NULL      -- metros
- lineas_tela               INTEGER NOT NULL
- gramaje_gm2               INTEGER NOT NULL           -- g/m²

-- DATOS CALCULADOS (persistidos para histórico y rendimiento)
- area_prenda_m2            DECIMAL(6,3) NOT NULL
- area_total_disponible_m2  DECIMAL(10,3) NOT NULL
- prendas_por_linea         INTEGER NOT NULL
- total_prendas             INTEGER NOT NULL
- area_consumida_m2         DECIMAL(10,3) NOT NULL
- retal_generado_m2         DECIMAL(10,3) NOT NULL
- pct_retal                 DECIMAL(5,2) NOT NULL      -- %
- pct_aprovechamiento       DECIMAL(5,2) NOT NULL      -- %
- pct_reciclable            DECIMAL(5,2) NOT NULL      -- %
- kg_retal_generado         DECIMAL(10,3) NOT NULL
- destino_retal             VARCHAR(20) NOT NULL       -- "Reciclable" / "Desechado"

-- TRAZABILIDAD
- alerta_retal              BOOLEAN DEFAULT false
- alerta_aprovechamiento    BOOLEAN DEFAULT false
- created_at                TIMESTAMPTZ DEFAULT NOW()
- updated_at                TIMESTAMPTZ DEFAULT NOW()
```

### 7.2 Diagrama Entidad-Relación (texto)

```
┌─────────────────┐      ┌──────────────────────────────────────────────────┐
│  tipo_telas     │      │                    cortes                        │
│─────────────────│      │──────────────────────────────────────────────────│
│ id (PK)         │◄─────│ tipo_tela_id (FK)                                │
│ nombre          │      │ id (PK)                                          │
│ composicion     │      │ fecha_corte                                      │
│ ancho_util      │      │ departamento                                     │
│ gramaje_min     │      │ mesa_corte_id (FK) ─────────────────────────────►│ mesas_corte
│ gramaje_max     │      │ operario_id (FK) ───────────────────────────────►│ operarios
└─────────────────┘      │ proveedor_id (FK) ──────────────────────────────►│ proveedores
                         │ lote_tela                                        │
┌─────────────────┐      │ referencia_prenda                                │
│  proveedores    │      │ talla_prenda                                     │
│─────────────────│◄─────│ largo_tela_m                                     │
│ id (PK)         │      │ ancho_tela_m          [CALCULADOS]               │
│ nombre          │      │ lineas_tela            area_prenda_m2            │
│ activo          │      │ gramaje_gm2            area_total_disponible_m2  │
└─────────────────┘      │                        prendas_por_linea         │
                         │                        total_prendas             │
┌─────────────────┐      │                        area_consumida_m2         │
│  operarios      │      │                        retal_generado_m2         │
│─────────────────│◄─────│                        pct_retal                 │
│ id (PK)         │      │                        pct_aprovechamiento       │
│ nombre          │      │                        pct_reciclable            │
│ activo          │      │                        kg_retal_generado         │
└─────────────────┘      │                        destino_retal             │
                         │                        alerta_retal              │
┌─────────────────┐      │                        alerta_aprovechamiento    │
│  mesas_corte    │      │                        created_at                │
│─────────────────│◄─────│                        updated_at                │
│ id (PK)         │      └──────────────────────────────────────────────────┘
│ nombre          │
│ activo          │
└─────────────────┘

┌──────────────────────┐
│  referencias_prendas │   (Tabla de lookup para área — no FK directa en cortes,
│──────────────────────│    se consulta en tiempo real y el resultado se persiste)
│ id (PK)              │
│ nombre               │
│ talla                │
│ area_m2              │
└──────────────────────┘
```

---

## 8. FÓRMULAS DOCUMENTADAS

### F-01: Área Total Disponible
```
AreaTotal = LargoTela (m) × AnchoTela (m)
```

### F-02: Prendas por Línea
```
PrendasPorLinea = FLOOR(AreaTotal / AreaPrenda)
```
> Se usa FLOOR (redondeo hacia abajo) porque no se pueden cortar fracciones de prenda.

### F-03: Total de Prendas
```
TotalPrendas = PrendasPorLinea × LineasTela
```

### F-04: Área Consumida
```
AreaConsumida = TotalPrendas × AreaPrenda
```

### F-05: Retal Generado
```
RetalGenerado = AreaTotal - AreaConsumida
```

### F-06: Porcentaje de Retal
```
PctRetal = (RetalGenerado / AreaTotal) × 100
```

### F-07: Porcentaje de Aprovechamiento
```
PctAprovechamiento = (AreaConsumida / AreaTotal) × 100
              = 100 - PctRetal
```

### F-08: Kilogramos de Retal
```
KgRetal = RetalGenerado (m²) × Gramaje (g/m²) / 1000
```

### F-09: Destino del Retal
```
SI PctReciclable ≥ 60 → Destino = "Reciclable"
SINO                  → Destino = "Desechado"
```

---

## 9. CATÁLOGOS PARA POBLAR EN LA BASE DE DATOS

### Operarios (seed)
```
Camila Patiño, Juana Vergara, Daniela Salazar, German Cano,
Leonel Armando, Jaime Bolivar, Oscar Lopera
```

### Mesas de corte (seed)
```
Mesa 1, Mesa 2, Mesa 3
```

### Departamentos (constante en código, no tabla)
```
Corte, Almacen, inventario
```

### Tipos de tela (seed desde Hoja2)
```
Algodón jersey 100%    | 100% Algodón     | 1.80 m | 180 g/m²
Algodón jersey pesado  | 100% Algodón     | 1.80 m | 220 g/m²
Burda perchada         | Mezcla           | 1.80 m | 280 g/m²
French Terry           | Algodón/Poliéster| 1.80 m | 260 g/m²
Piqué polo             | Algodón/Poliéster| 1.70 m | 220 g/m²
Drill liviano          | 100% Algodón     | 1.50 m | 240 g/m²
Drill pesado           | 100% Algodón     | 1.50 m | 320 g/m²
Denim (jean)           | Algodón/Elastano | 1.50 m | 425 g/m² (promedio)
Poliéster deportivo    | 100% Poliéster   | 1.60 m | 150 g/m² (promedio)
Softshell              | Poliéster/Nylon  | 1.50 m | 300 g/m²
```

### Referencias de prenda (seed)
```
Camisa  | S=0.40 | M=0.42 | L=0.45 | XL=0.48
Pantalon| S=0.95 | M=1.05 | L=1.15 | XL=1.25
Buso    | S=0.68 | M=0.76 | L=0.81 | XL=0.85
Chaqueta| S=0.87 | M=0.98 | L=1.08 | XL=1.16
```

---

## 10. PANTALLAS / MÓDULOS DEL SISTEMA

| # | Módulo | Ruta | Descripción |
|---|--------|------|-------------|
| 1 | Formulario de Corte | `/` | Pantalla principal de registro |
| 2 | Dashboard Gerencial | `/dashboard` | KPIs + gráficos interactivos |
| 3 | Reportes | `/reportes` | 6 tipos de reporte + exportación |
| 4 | Histórico de Cortes | `/historico` | Tabla con filtros y búsqueda |

---

## 11. CHECKLIST DE APROBACIÓN — FASE 1

Antes de avanzar a la Fase 2, confirmar:

- [ ] Los catálogos del Excel coinciden con este documento
- [ ] Las fórmulas de cálculo son correctas
- [ ] La arquitectura (Next.js monorepo + Supabase) es aprobada
- [ ] El modelo de datos cubre todas las variables requeridas
- [ ] Las reglas de negocio (alertas, destino, reciclable) están correctas
- [ ] La estructura de carpetas es adecuada

---

*Documento generado como parte de la Fase 1. Al aprobar, se procederá con la Fase 2: Base de datos completa (schema Prisma + scripts SQL + seeds).*
