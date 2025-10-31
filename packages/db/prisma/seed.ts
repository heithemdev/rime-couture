/* eslint-disable no-console */
import { randomUUID } from 'crypto'
import { prisma } from '../src/prisma'

const WILAYAS: Array<{ id: number; name: string }> = [
  { id: 1, name: 'Adrar' }, { id: 2, name: 'Chlef' }, { id: 3, name: 'Laghouat' },
  { id: 4, name: 'Oum El Bouaghi' }, { id: 5, name: 'Batna' }, { id: 6, name: 'Béjaïa' },
  { id: 7, name: 'Biskra' }, { id: 8, name: 'Béchar' }, { id: 9, name: 'Blida' },
  { id: 10, name: 'Bouira' }, { id: 11, name: 'Tamanrasset' }, { id: 12, name: 'Tébessa' },
  { id: 13, name: 'Tlemcen' }, { id: 14, name: 'Tiaret' }, { id: 15, name: 'Tizi Ouzou' },
  { id: 16, name: 'Alger' }, { id: 17, name: 'Djelfa' }, { id: 18, name: 'Jijel' },
  { id: 19, name: 'Sétif' }, { id: 20, name: 'Saïda' }, { id: 21, name: 'Skikda' },
  { id: 22, name: 'Sidi Bel Abbès' }, { id: 23, name: 'Annaba' }, { id: 24, name: 'Guelma' },
  { id: 25, name: 'Constantine' }, { id: 26, name: 'Médéa' }, { id: 27, name: 'Mostaganem' },
  { id: 28, name: 'M’Sila' }, { id: 29, name: 'Mascara' }, { id: 30, name: 'Ouargla' },
  { id: 31, name: 'Oran' }, { id: 32, name: 'El Bayadh' }, { id: 33, name: 'Illizi' },
  { id: 34, name: 'Bordj Bou Arréridj' }, { id: 35, name: 'Boumerdès' }, { id: 36, name: 'El Tarf' },
  { id: 37, name: 'Tindouf' }, { id: 38, name: 'Tissemsilt' }, { id: 39, name: 'El Oued' },
  { id: 40, name: 'Khenchela' }, { id: 41, name: 'Souk Ahras' }, { id: 42, name: 'Tipaza' },
  { id: 43, name: 'Mila' }, { id: 44, name: 'Aïn Defla' }, { id: 45, name: 'Naâma' },
  { id: 46, name: 'Aïn Témouchent' }, { id: 47, name: 'Ghardaïa' }, { id: 48, name: 'Relizane' },
  { id: 49, name: 'Timimoun' }, { id: 50, name: 'Bordj Badji Mokhtar' }, { id: 51, name: 'Ouled Djellal' },
  { id: 52, name: 'Béni Abbès' }, { id: 53, name: 'In Salah' }, { id: 54, name: 'In Guezzam' },
  { id: 55, name: 'Touggourt' }, { id: 56, name: 'Djanet' }, { id: 57, name: 'El M’ghair' },
  { id: 58, name: 'El Meniaa' }
]

async function main() {
  console.log('🌱 Seeding baseline config + wilayas...')

  // Singleton platform config with safe defaults (you can edit later in admin)
  await prisma.platformConfig.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commissionRateBps: 300, payoutMinAmountDA: 500 }
  })

  // All wilayas (idempotent)
  await prisma.wilaya.createMany({ data: WILAYAS, skipDuplicates: true })

  console.log('✅ Done.')
}

main()
  .then(async () => { await prisma.$disconnect() })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
