-- =============================================================
-- 02_seed.sql — Datos iniciales de catálogos
-- Ejecutar DESPUÉS de 01_schema.sql
-- =============================================================

INSERT INTO tipo_telas (nombre, composicion, ancho_util, gramaje_min, gramaje_max) VALUES
  ('Algodón jersey 100%',   '100% Algodón',             1.80, 180, 180),
  ('Algodón jersey pesado', '100% Algodón',             1.80, 220, 220),
  ('Burda perchada',        'Mezcla Algodón/Poliéster', 1.80, 280, 280),
  ('French Terry',          'Algodón/Poliéster',        1.80, 260, 260),
  ('Piqué polo',            'Algodón/Poliéster',        1.70, 220, 220),
  ('Drill liviano',         '100% Algodón',             1.50, 240, 240),
  ('Drill pesado',          '100% Algodón',             1.50, 320, 320),
  ('Denim (jean)',           'Algodón/Elastano',          1.50, 400, 450),
  ('Poliéster deportivo',   '100% Poliéster',            1.60, 140, 160),
  ('Softshell',             'Poliéster/Nylon',           1.50, 300, 300)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO operarios (nombre) VALUES
  ('Camila Patiño'),('Juana Vergara'),('Daniela Salazar'),
  ('German Cano'),('Leonel Armando'),('Jaime Bolivar'),('Oscar Lopera')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO mesas_corte (nombre) VALUES
  ('Mesa 1'),('Mesa 2'),('Mesa 3')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO proveedores (nombre) VALUES
  ('Textiles Medellín S.A.'),('Coltejer'),('Fabricato'),
  ('Textiles Lafayette'),('Proveedor Externo')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO referencias_prendas (nombre, talla, area_m2) VALUES
  ('Camisa','S',0.400),('Camisa','M',0.420),('Camisa','L',0.450),('Camisa','XL',0.480),
  ('Pantalon','S',0.950),('Pantalon','M',1.050),('Pantalon','L',1.150),('Pantalon','XL',1.250),
  ('Buso','S',0.680),('Buso','M',0.760),('Buso','L',0.810),('Buso','XL',0.850),
  ('Chaqueta','S',0.870),('Chaqueta','M',0.980),('Chaqueta','L',1.080),('Chaqueta','XL',1.160)
ON CONFLICT (nombre, talla) DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'SEED OK: tipo_telas=%, operarios=%, mesas=%, proveedores=%, referencias=%',
    (SELECT COUNT(*) FROM tipo_telas),
    (SELECT COUNT(*) FROM operarios),
    (SELECT COUNT(*) FROM mesas_corte),
    (SELECT COUNT(*) FROM proveedores),
    (SELECT COUNT(*) FROM referencias_prendas);
END;
$$;
