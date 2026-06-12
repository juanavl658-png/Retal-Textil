-- =============================================================
-- 03_verificacion.sql — Consultas de validación del schema
-- =============================================================

-- 1. Tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;

-- 2. Conteo de registros
SELECT 'tipo_telas'          AS tabla, COUNT(*) AS registros FROM tipo_telas   UNION ALL
SELECT 'operarios',                    COUNT(*)              FROM operarios     UNION ALL
SELECT 'mesas_corte',                  COUNT(*)              FROM mesas_corte   UNION ALL
SELECT 'proveedores',                  COUNT(*)              FROM proveedores   UNION ALL
SELECT 'referencias_prendas',          COUNT(*)              FROM referencias_prendas UNION ALL
SELECT 'cortes',                       COUNT(*)              FROM cortes;

-- 3. Validación de fórmulas con ejemplo:
-- Camisa M, 10m x 1.80m, 3 líneas, Algodón jersey 100%
SELECT
  10.0 * 1.80                                                   AS area_total_por_capa_m2,
  FLOOR((10.0 * 1.80) / 0.42)                                   AS prendas_por_linea,
  FLOOR((10.0 * 1.80) / 0.42) * 3                               AS total_prendas,
  FLOOR((10.0 * 1.80) / 0.42) * 3 * 0.42                        AS area_consumida_m2,
  (10.0 * 1.80 * 3) - (FLOOR((10.0 * 1.80) / 0.42) * 3 * 0.42) AS retal_m2,
  ROUND(((10.0*1.80*3) - (FLOOR((10.0*1.80)/0.42)*3*0.42)) / (10.0*1.80*3) * 100, 2) AS pct_retal,
  ROUND((FLOOR((10.0*1.80)/0.42)*3*0.42) / (10.0*1.80*3) * 100, 2) AS pct_aprovechamiento;
