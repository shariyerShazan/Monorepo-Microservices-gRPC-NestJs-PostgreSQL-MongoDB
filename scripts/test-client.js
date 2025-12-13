const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")
const path = require("path")

// Load proto file
const PROTO_PATH = path.join(__dirname, "../protos/microservices.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const microservices = grpc.loadPackageDefinition(packageDefinition).microservices

// Create gRPC clients
const authClient = new microservices.AuthService("localhost:50051", grpc.credentials.createInsecure())

const productClient = new microservices.ProductService("localhost:50052", grpc.credentials.createInsecure())

const orderClient = new microservices.OrderService("localhost:50053", grpc.credentials.createInsecure())

// Test data
let authToken = ""
let userId = ""
let productId = ""

async function testAuthService() {
  console.log("\n=== Testing Auth Service ===\n")

  // Register
  return new Promise((resolve, reject) => {
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: "password123",
      name: "Test User",
    }

    console.log("1. Registering user...")
    authClient.Register(registerData, (error, response) => {
      if (error) {
        console.error("Registration failed:", error.message)
        return reject(error)
      }

      console.log("✓ Registration successful!")
      console.log("  User ID:", response.userId)
      console.log("  Token:", response.token.substring(0, 50) + "...")

      authToken = response.token
      userId = response.userId

      // Validate token
      console.log("\n2. Validating token...")
      authClient.ValidateToken({ token: authToken }, (error, response) => {
        if (error) {
          console.error("Token validation failed:", error.message)
          return reject(error)
        }

        console.log("✓ Token is valid!")
        console.log("  User ID:", response.userId)
        console.log("  Email:", response.email)
        resolve()
      })
    })
  })
}

async function testProductService() {
  console.log("\n=== Testing Product Service ===\n")

  return new Promise((resolve, reject) => {
    // Create product
    const productData = {
      name: "Test Product",
      description: "This is a test product created by the test client",
      price: 99.99,
      stock: 100,
    }

    console.log("1. Creating product...")
    productClient.CreateProduct(productData, (error, response) => {
      if (error) {
        console.error("Product creation failed:", error.message)
        return reject(error)
      }

      console.log("✓ Product created!")
      console.log("  Product ID:", response.id)
      console.log("  Name:", response.name)
      console.log("  Price:", response.price)

      productId = response.id

      // List products
      console.log("\n2. Listing products...")
      productClient.ListProducts({ page: 1, limit: 5 }, (error, response) => {
        if (error) {
          console.error("List products failed:", error.message)
          return reject(error)
        }

        console.log("✓ Products listed!")
        console.log("  Total:", response.total)
        console.log("  Products:", response.products.length)
        resolve()
      })
    })
  })
}

async function testOrderService() {
  console.log("\n=== Testing Order Service ===\n")

  return new Promise((resolve, reject) => {
    // Create order (this will validate token with Auth Service)
    const orderData = {
      userId: userId,
      productId: productId,
      quantity: 2,
      token: authToken,
    }

    console.log("1. Creating order (validating token with Auth Service)...")
    orderClient.CreateOrder(orderData, (error, response) => {
      if (error) {
        console.error("Order creation failed:", error.message)
        return reject(error)
      }

      console.log("✓ Order created (token validated)!")
      console.log("  Order ID:", response.id)
      console.log("  User ID:", response.userId)
      console.log("  Product ID:", response.productId)
      console.log("  Quantity:", response.quantity)
      console.log("  Status:", response.status)

      // List orders
      console.log("\n2. Listing orders...")
      orderClient.ListOrders({ userId: userId, page: 1, limit: 5 }, (error, response) => {
        if (error) {
          console.error("List orders failed:", error.message)
          return reject(error)
        }

        console.log("✓ Orders listed!")
        console.log("  Total:", response.total)
        console.log("  Orders:", response.orders.length)
        resolve()
      })
    })
  })
}

async function runTests() {
  try {
    console.log("╔════════════════════════════════════════════╗")
    console.log("║  NestJS Microservices gRPC Test Client    ║")
    console.log("╚════════════════════════════════════════════╝")

    await testAuthService()
    await testProductService()
    await testOrderService()

    console.log("\n╔════════════════════════════════════════════╗")
    console.log("║  ✓ All tests passed successfully!         ║")
    console.log("╚════════════════════════════════════════════╝\n")

    process.exit(0)
  } catch (error) {
    console.error("\n✗ Tests failed:", error.message)
    process.exit(1)
  }
}

// Run tests
runTests()
