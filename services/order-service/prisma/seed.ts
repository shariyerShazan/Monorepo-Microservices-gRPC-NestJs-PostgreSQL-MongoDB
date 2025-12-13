import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log("Seeding database...")

    // Clear existing orders
    await prisma.order.deleteMany({})

    console.log("Seed data created successfully (orders table ready)")

    await prisma.$disconnect()
  } catch (error) {
    console.error("Seed error:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seed()
