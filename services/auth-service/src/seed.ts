import { connect, disconnect } from "mongoose"
import * as bcrypt from "bcrypt"

const MONGO_URI = process.env.MONGO_URI! || "mongodb://localhost:27017/auth-db"

async function seed() {
  try {
    await connect(MONGO_URI)
    console.log("Connected to MongoDB")

    const db = (await import("mongoose")).connection.db!
    const usersCollection = db.collection("users")

    await usersCollection.deleteMany({})

    const hashedPassword = await bcrypt.hash("password123", 10)
    await usersCollection.insertOne({
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    console.log("Seed data created successfully")
    console.log("Test user: test@example.com / password123")

    await disconnect()
  } catch (error) {
    console.error("Seed error:", error)
    process.exit(1)
  }
}

seed()
