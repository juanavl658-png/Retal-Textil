-- =============================================================
-- 01_schema.sql — Creación de tablas, índices y vistas
-- Sistema de Gestión de Retal Textil
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS tipo_telas (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL UNIQUE,
  composicion  VARCHAR(100) NOT NULL,
  ancho_util   DECIMAL(5,2) NOT NULL,
  gramaje_min  INTEGER      NOT NULL,
  gramaje_max  INTEGER      NOT NULL,
  activo       BOOLEAN      NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_ancho_positivo CHECK (ancho_util > 0),
  CONSTRAINT chk_gramaje_valido CHECK (gramaje_min > 0 AND gramaje_max >= gramaje_min)
);

CREATE TABLE IF NOT EXISTS proveedores (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL UNIQUE,
  activo     BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS operarios (
  id         SERIAL PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL UNIQUE,
  activo     BOOLEAN      NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mesas_corte (
  id     SERIAL PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE,
  activo BOOLEAN     NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS referencias_prendas (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(50)  NOT NULL,
  talla    VARCHAR(5)   NOT NULL,
  area_m2  DECIMAL(5,3) NOT NULL,
  CONSTRAINT uq_referencia_talla UNIQUE (nombre, talla),
  CONSTRAINT chk_area_positiva   CHECK  (area_m2 > 0)
);

CREATE TABLE IF NOT EXISTS cortes (
  id SERIAL PRIMARY KEY,
  fecha_corte                 DATE         NOT NULL,
  departamento                VARCHAR(50)  NOT NULL,
  mesa_corte_id               INTEGER      NOT NULL REFERENCES mesas_corte(id),
  operario_id                 INTEGER      NOT NULL REFERENCES operarios(id),
  tipo_tela_id                INTEGER      NOT NULL REFERENCES tipo_telas(id),
  proveedor_id                INTEGER      NOT NULL REFERENCES proveedores(id),
  lote_tela                   VARCHAR(100) NOT NULL,
  referencia_prenda           VARCHAR(50)  NOT NULL,
  talla_prenda                VARCHAR(5)   NOT NULL,
  largo_tela_m                DECIMAL(8,2) NOT NULL,
  ancho_tela_m                DECIMAL(5,2) NOT NULL,
  lineas_tela                 INTEGER      NOT NULL,
  gramaje_gm2                 INTEGER      NOT NULL,
  area_prenda_m2              DECIMAL(6,3)  NOT NULL,
  area_total_disponible_m2    DECIMAL(10,3) NOT NULL,
  prendas_por_linea           INTEGER       NOT NULL,
  total_prendas               INTEGER       NOT NULL,
  area_consumida_m2           DECIMAL(10,3) NOT NULL,
  retal_generado_m2           DECIMAL(10,3) NOT NULL,
  pct_retal                   DECIMAL(5,2)  NOT NULL,
  pct_aprovechamiento         DECIMAL(5,2)  NOT NULL,
  pct_reciclable              DECIMAL(5,2)  NOT NULL,
  kg_retal_generado           DECIMAL(10,3) NOT NULL,
  destino_retal               VARCHAR(20)   NOT NULL,
  alerta_retal                BOOLEAN      NOT NULL DEFAULT false,
  alerta_aprovechamiento      BOOLEAN      NOT NULL DEFAULT false,
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_departamento CHECK (departamento = 'Corte'),
  CONSTRAINT chk_talla        CHECK (talla_prenda IN ('S','M','L','XL')),
  CONSTRAINT chk_referencia   CHECK (referencia_prenda IN ('Camisa','Pantalon','Buso','Chaqueta')),
  CONSTRAINT chk_destino      CHECK (destino_retal IN ('Reciclable','Desechado')),
  CONSTRAINT chk_lineas       CHECK (lineas_tela BETWEEN 1 AND 100),
  CONSTRAINT chk_largo        CHECK (largo_tela_m > 0),
  CONSTRAINT chk_ancho        CHECK (ancho_tela_m > 0)
);

CREATE INDEX IF NOT EXISTS idx_cortes_fecha      ON cortes(fecha_corte);
CREATE INDEX IF NOT EXISTS idx_cortes_operario   ON cortes(operario_id);
CREATE INDEX IF NOT EXISTS idx_cortes_tipo_tela  ON cortes(tipo_tela_id);
CREATE INDEX IF NOT EXISTS idx_cortes_mesa       ON cortes(mesa_corte_id);
CREATE INDEX IF NOT EXISTS idx_cortes_proveedor  ON cortes(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_cortes_destino    ON cortes(destino_retal);
CREATE INDEX IF NOT EXISTS idx_cortes_created    ON cortes(created_at);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cortes_updated_at ON cortes;
CREATE TRIGGER trg_cortes_updated_at
  BEFORE UPDATE ON cortes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE VIEW v_cortes_detalle AS
SELECT c.*, mc.nombre AS mesa_corte, o.nombre AS operario,
       tt.nombre AS tipo_tela, tt.composicion AS composicion_textil, p.nombre AS proveedor
FROM cortes c
JOIN mesas_corte mc ON c.mesa_corte_id = mc.id
JOIN operarios   o  ON c.operario_id   = o.id
JOIN tipo_telas  tt ON c.tipo_tela_id  = tt.id
JOIN proveedores p  ON c.proveedor_id  = p.id;

CREATE OR REPLACE VIEW v_kpis_globales AS
SELECT
  COUNT(*)                                                          AS total_cortes,
  COALESCE(SUM(area_total_disponible_m2), 0)                       AS total_tela_procesada_m2,
  COALESCE(SUM(retal_generado_m2), 0)                              AS total_retal_generado_m2,
  COALESCE(SUM(kg_retal_generado), 0)                              AS total_kg_retal,
  COALESCE(AVG(pct_aprovechamiento), 0)                            AS avg_pct_aprovechamiento,
  COALESCE(AVG(pct_retal), 0)                                      AS avg_pct_retal,
  COALESCE(SUM(kg_retal_generado) FILTER (WHERE destino_retal = 'Reciclable'), 0) AS kg_reciclables,
  COALESCE(SUM(kg_retal_generado) FILTER (WHERE destino_retal = 'Desechado'),  0) AS kg_desechados
FROM cortes;

CREATE OR REPLACE VIEW v_aprovechamiento_por_mes AS
SELECT
  DATE_TRUNC('month', fecha_corte)::DATE AS mes,
  TO_CHAR(fecha_corte, 'YYYY-MM')        AS mes_label,
  COUNT(*)                               AS total_cortes,
  AVG(pct_aprovechamiento)               AS avg_pct_aprovechamiento,
  AVG(pct_retal)                         AS avg_pct_retal,
  SUM(retal_generado_m2)                 AS total_retal_m2,
  SUM(kg_retal_generado)                 AS total_kg_retal,
  SUM(total_prendas)                     AS total_prendas
FROM cortes
GROUP BY DATE_TRUNC('month', fecha_corte), TO_CHAR(fecha_corte, 'YYYY-MM')
ORDER BY mes;
