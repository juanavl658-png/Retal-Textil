// prisma/seed.ts — Seed de catálogos vía Prisma Client
// Ejecutar: npx prisma db seed

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de catálogos...\n')

  const tiposTela = [
    { nombre: 'Algodón jersey 100%',   composicion: '100% Algodón',             anchoUtil: 1.80, gramajeMin: 180, gramajeMax: 180 },
    { nombre: 'Algodón jersey pesado', composicion: '100% Algodón',             anchoUtil: 1.80, gramajeMin: 220, gramajeMax: 220 },
    { nombre: 'Burda perchada',        composicion: 'Mezcla Algodón/Poliéster', anchoUtil: 1.80, gramajeMin: 280, gramajeMax: 280 },
    { nombre: 'French Terry',          composicion: 'Algodón/Poliéster',        anchoUtil: 1.80, gramajeMin: 260, gramajeMax: 260 },
    { nombre: 'Piqué polo',            composicion: 'Algodón/Poliéster',        anchoUtil: 1.70, gramajeMin: 220, gramajeMax: 220 },
    { nombre: 'Drill liviano',         composicion: '100% Algodón',             anchoUtil: 1.50, gramajeMin: 240, gramajeMax: 240 },
    { nombre: 'Drill pesado',          composicion: '100% Algodón',             anchoUtil: 1.50, gramajeMin: 320, gramajeMax: 320 },
    { nombre: 'Denim (jean)',           composicion: 'Algodón/Elastano',          anchoUtil: 1.50, gramajeMin: 400, gramajeMax: 450 },
    { nombre: 'Poliéster deportivo',   composicion: '100% Poliéster',            anchoUtil: 1.60, gramajeMin: 140, gramajeMax: 160 },
    { nombre: 'Softshell',             composicion: 'Poliéster/Nylon',           anchoUtil: 1.50, gramajeMin: 300, gramajeMax: 300 },
  ]
  for (const t of tiposTela) {
    await prisma.tipoTela.upsert({ where: { nombre: t.nombre }, update: {}, create: t })
  }
  console.log(`   ✅ ${tiposTela.length} tipos de tela`)

  const operarios = ['Camila Patiño','Juana Vergara','Daniela Salazar','German Cano','Leonel Armando','Jaime Bolivar','Oscar Lopera']
  for (const nombre of operarios) {
    await prisma.operario.upsert({ where: { nombre }, update: {}, create: { nombre } })
  }
  console.log(`   ✅ ${operarios.length} operarios`)

  const mesas = ['Mesa 1','Mesa 2','Mesa 3']
  for (const nombre of mesas) {
    await prisma.mesaCorte.upsert({ where: { nombre }, update: {}, create: { nombre } })
  }
  console.log(`   ✅ ${mesas.length} mesas`)

  const proveedores = ['Textiles Medellín S.A.','Coltejer','Fabricato','Textiles Lafayette','Proveedor Externo']
  for (const nombre of proveedores) {
    await prisma.proveedor.upsert({ where: { nombre }, update: {}, create: { nombre } })
  }
  console.log(`   ✅ ${proveedores.length} proveedores`)

  const referencias = [
    { nombre: 'Camisa',   talla: 'S',  areaM2: 0.400 },
    { nombre: 'Camisa',   talla: 'M',  areaM2: 0.420 },
    { nombre: 'Camisa',   talla: 'L',  areaM2: 0.450 },
    { nombre: 'Camisa',   talla: 'XL', areaM2: 0.480 },
    { nombre: 'Pantalon', talla: 'S',  areaM2: 0.950 },
    { nombre: 'Pantalon', talla: 'M',  areaM2: 1.050 },
    { nombre: 'Pantalon', talla: 'L',  areaM2: 1.150 },
    { nombre: 'Pantalon', talla: 'XL', areaM2: 1.250 },
    { nombre: 'Buso',     talla: 'S',  areaM2: 0.680 },
    { nombre: 'Buso',     talla: 'M',  areaM2: 0.760 },
    { nombre: 'Buso',     talla: 'L',  areaM2: 0.810 },
    { nombre: 'Buso',     talla: 'XL', areaM2: 0.850 },
    { nombre: 'Chaqueta', talla: 'S',  areaM2: 0.870 },
    { nombre: 'Chaqueta', talla: 'M',  areaM2: 0.980 },
    { nombre: 'Chaqueta', talla: 'L',  areaM2: 1.080 },
    { nombre: 'Chaqueta', talla: 'XL', areaM2: 1.160 },
  ]
  for (const r of referencias) {
    await prisma.referenciaPrenda.upsert({
      where: { nombre_talla: { nombre: r.nombre, talla: r.talla } },
      update: {}, create: r,
    })
  }
  console.log(`   ✅ ${referencias.length} referencias de prenda`)
  console.log('\n🎉 SEED COMPLETADO\n')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
