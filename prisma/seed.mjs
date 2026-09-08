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

try {
  for (const [sortOrder, name] of defaultCategories.entries()) {
    await prisma.category.upsert({
      where: { name },
      create: { name, sortOrder },
      update: { sortOrder },
    })
  }
  console.log(`Seeded ${defaultCategories.length} default categories.`)
} finally {
  await prisma.$disconnect()
}
