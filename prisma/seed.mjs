import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const defaultCategories = [
  'Clothing',
  'Sports',
  'Home & Kitchen',
  'Furniture',
  'Footwear',
  'Jewelry',
  'Accessories',
  'Watches',
  'Electronics',
  'Toys',
]
const defaultProducts = [
  ['5 IN 1 LAUNDRY PODS WITHOUT BOX PACK OF 50 PCS', 'Home & Kitchen'],
  ['MAGNETIC NEEDLE ORGANIZER 12 NEEDLES INCLUDING', 'Accessories'],
  ['600 ML STYLISH TUMBLR', 'Home & Kitchen'],
  ['STYLISH MINI CHIC HANDBAG', 'Accessories'],
  ['CUTE BOW SHAPE SLING BAG', 'Accessories'],
  ['FLEXIBLE LED FLASH LIGHT', 'Electronics'],
  ['MAGIC CLEANING SPONGE PACK OF 10 PCS', 'Home & Kitchen'],
  ['GLASS STERING SPOON', 'Home & Kitchen'],
  ['CUTE CAT BAGPACK', 'Accessories'],
  ['7 HEAD PREMIUM MASSAGER', 'Electronics'],
  ['MAGIC SAND', 'Toys'],
  ['NEW CUTE MULTIPURPOSE USE STORAGE ORGANIZER', 'Home & Kitchen'],
  ['NEW MAGNETIC LED RECHARGEABLE LIGHT', 'Electronics'],
  ['CUTE PANDA REFRIGERATOR MAGNET PACK OF 5 PCS', 'Home & Kitchen'],
  ['CUTE STYLISH REFRIGERATOR DECORATION MAGNET PACK OF 8 PCS', 'Home & Kitchen'],
  ['5 IN 1 LAUNDRY PODS WITHOUT BOX PACK OF 140 PCS', 'Home & Kitchen'],
  ['PORTABLE ORAL DENTAL FLOSSER', 'Electronics'],
  ['WARM THIGH HIGH SOCKS', 'Clothing'],
].map(([name, category]) => ({
  id: `seed-product-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
  name,
  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  category,
}))

try {
  for (const [sortOrder, name] of defaultCategories.entries()) {
    await prisma.category.upsert({
      where: { name },
      create: { name, sortOrder },
      update: { sortOrder },
    })
  }
  console.log(`Seeded ${defaultCategories.length} default categories.`)

  for (const product of defaultProducts) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        ...product,
        description: null,
        priceMinor: 10000,
        stock: 1000,
        isActive: true,
        colors: { create: [{ name: 'Default', hex: '#A8A29E' }] },
      },
      // Preserve any product details edited after the initial seed.
      update: {},
    })
  }
  console.log(`Seeded ${defaultProducts.length} default platform product placeholders.`)
} finally {
  await prisma.$disconnect()
}
