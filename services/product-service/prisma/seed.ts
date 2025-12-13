import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function seed() {
  try {
    console.log("Seeding database...")

    // Clear existing products
    await prisma.product.deleteMany({})

    // Create sample products
    await prisma.product.createMany({
      data: [
        {
          name: "Laptop Pro",
          description: "High-performance laptop for professionals",
          price: 1299.99,
          stock: 50,
        },
        {
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse with precision tracking",
          price: 29.99,
          stock: 150,
        },
        {
          name: "Mechanical Keyboard",
          description: "RGB mechanical keyboard with Cherry MX switches",
          price: 149.99,
          stock: 75,
        },
      ],
    })

    console.log("Seed data created successfully")

    await prisma.$disconnect()
  } catch (error) {
    console.error("Seed error:", error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

seed()
