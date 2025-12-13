# NestJS Microservices - Advanced Edition

A complete production-ready microservices architecture built with **NestJS**, **gRPC**, **MongoDB**, **PostgreSQL**, and **Stripe**. This monorepo demonstrates advanced inter-service communication, role-based access control, payment integration, and complex business logic enforcement.

## Architecture

### Services

1. **Auth Service** (Port: 50051)
   - Technology: MongoDB with Mongoose
   - Features: User registration, login with JWT, token validation, role-based access control (admin/user)
   - Database: MongoDB
   - Security: bcrypt password hashing, JWT with role claims

2. **Product Service** (Port: 50052)
   - Technology: PostgreSQL with Prisma ORM
   - Features: Admin-only product creation/editing, status management, product search
   - Database: PostgreSQL
   - Authorization: Validates tokens and enforces admin-only operations

3. **Order Service** (Port: 50053)
   - Technology: PostgreSQL with Prisma ORM
   - Features: Order creation with validation, Stripe payment integration, webhook handling, status management
   - Dependencies: Auth Service (validation), Product Service (product lookup)
   - Database: PostgreSQL
   - Payment: Stripe checkout and webhook processing

4. **Chat Service** (Port: 50054)
   - Technology: MongoDB with Mongoose
   - Features: Messaging with strict permission rules, admin broadcast capability
   - Dependencies: Auth Service (user lookup), Order Service (purchase verification)
   - Database: MongoDB
   - Rules: Users can only message admin after purchasing and receiving a delivered product

### Communication

All services communicate via **gRPC** using Protocol Buffers defined in `protos/microservices.proto`.

## Project Structure

\`\`\`
/
├── README.md
├── ARCHITECTURE.md              # Detailed architecture documentation
├── docker-compose.yml            # Multi-service orchestration
├── .env.example
├── package.json
├── protos/
│   └── microservices.proto       # Complete gRPC service definitions
├── scripts/
│   ├── setup-local.sh
│   ├── seed-all.sh
│   └── test-client.js
└── services/
    ├── auth-service/             # Authentication with RBAC
    │   ├── Dockerfile
    │   ├── package.json
    │   └── src/
    │       ├── auth/
    │       │   ├── auth.controller.ts
    │       │   ├── auth.service.ts
    │       │   ├── schemas/user.schema.ts    # Role field added
    │       │   └── dto/
    │       └── common/
    │           ├── decorators/auth.decorator.ts
    │           ├── guards/
    │           ├── pipes/
    │           └── filters/
    ├── product-service/          # Admin-controlled products
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma     # Updated with title, status, ownerId
    │   └── src/
    │       ├── product/
    │       │   ├── product.service.ts    # Auth integration
    │       │   └── dto/
    │       └── common/
    ├── order-service/            # Orders with Stripe
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── prisma/
    │   │   └── schema.prisma     # Payment fields added
    │   └── src/
    │       ├── order/
    │       │   ├── order.service.ts      # Complex validation
    │       │   └── dto/
    │       └── webhook/
    │           └── webhook.controller.ts # Stripe webhooks
    └── chat-service/             # NEW: Messaging service
        ├── Dockerfile
        ├── package.json
        └── src/
            ├── chat/
            │   ├── chat.controller.ts
            │   ├── chat.service.ts       # Permission validation
            │   ├── schemas/message.schema.ts
            │   └── dto/
            └── common/
\`\`\`

## New Features

### 1. Role-Based Access Control (RBAC)
- Users have roles: `admin` or `user`
- Admin privileges:
  - Create and edit products
  - Update product status
  - Change order status
  - Send messages to any user
- User restrictions enforced at service level

### 2. Product Status Workflow
\`\`\`
pending → accepted → delivered
\`\`\`
- Only admins can change status
- Only "accepted" products can be ordered

### 3. Stripe Payment Integration
- Create payment intents on order creation
- Webhook endpoint for payment confirmation
- Automatic order status update on successful payment
- Idempotent webhook processing

### 4. Chat Service with Complex Rules
- **Admin**: Can message anyone
- **User**: Can ONLY message admin AND ONLY if:
  1. User has placed an order
  2. Order payment is completed
  3. Order status is "delivered"

### 5. Comprehensive Validation
- All DTOs validated with class-validator
- Proper gRPC exception handling
- Business rule enforcement
- Token validation on protected endpoints

## Prerequisites

- **Node.js** 20.x or higher
- **Docker** and **Docker Compose**
- **npm** or **yarn**
- **Stripe Account** (for payment features)

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone and setup**
   \`\`\`bash
   git clone <repository-url>
   cd nestjs-microservices-monorepo
   cp .env.example .env
   \`\`\`

2. **Configure Stripe** (in .env)
   \`\`\`env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   \`\`\`

3. **Start all services**
   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Check health**
   \`\`\`bash
   docker-compose ps
   \`\`\`

5. **View logs**
   \`\`\`bash
   docker-compose logs -f
   \`\`\`

### Option 2: Local Development

1. **Install dependencies**
   \`\`\`bash
   npm install
   cd services/auth-service && npm install && cd ../..
   cd services/product-service && npm install && cd ../..
   cd services/order-service && npm install && cd ../..
   cd services/chat-service && npm install && cd ../..
   \`\`\`

2. **Start databases**
   \`\`\`bash
   docker-compose up postgres mongo -d
   \`\`\`

3. **Setup environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. **Generate Prisma clients**
   \`\`\`bash
   cd services/product-service && npx prisma generate && cd ../..
   cd services/order-service && npx prisma generate && cd ../..
   \`\`\`

5. **Run migrations**
   \`\`\`bash
   cd services/product-service && npx prisma migrate dev && cd ../..
   cd services/order-service && npx prisma migrate dev && cd ../..
   \`\`\`

6. **Start services** (in separate terminals)
   \`\`\`bash
   # Terminal 1
   cd services/auth-service && npm run start:dev
   
   # Terminal 2
   cd services/product-service && npm run start:dev
   
   # Terminal 3
   cd services/order-service && npm run start:dev
   
   # Terminal 4
   cd services/chat-service && npm run start:dev
   \`\`\`

## Complete API Examples

### 1. Register Admin User

\`\`\`bash
grpcurl -plaintext -d '{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}' localhost:50051 microservices.AuthService/Register
\`\`\`

**Response:**
\`\`\`json
{
  "userId": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "User registered successfully",
  "role": "admin"
}
\`\`\`

### 2. Register Regular User

\`\`\`bash
grpcurl -plaintext -d '{
  "email": "user@example.com",
  "password": "user123",
  "name": "Regular User"
}' localhost:50051 microservices.AuthService/Register
\`\`\`

### 3. Create Product (Admin Only)

\`\`\`bash
grpcurl -plaintext -d '{
  "title": "Gaming Laptop",
  "description": "High-performance laptop for gaming",
  "price": 1599.99,
  "imageUrl": "https://example.com/laptop.jpg",
  "ownerId": "507f1f77bcf86cd799439011",
  "token": "ADMIN_JWT_TOKEN"
}' localhost:50052 microservices.ProductService/CreateProduct
\`\`\`

### 4. Update Product Status (Admin Only)

\`\`\`bash
grpcurl -plaintext -d '{
  "id": "product-uuid",
  "status": "accepted",
  "token": "ADMIN_JWT_TOKEN"
}' localhost:50052 microservices.ProductService/UpdateProductStatus
\`\`\`

### 5. Search Products

\`\`\`bash
grpcurl -plaintext -d '{
  "query": "laptop",
  "page": 1,
  "limit": 10
}' localhost:50052 microservices.ProductService/SearchProducts
\`\`\`

### 6. Create Order with Payment

\`\`\`bash
grpcurl -plaintext -d '{
  "productId": "product-uuid",
  "quantity": 1,
  "token": "USER_JWT_TOKEN"
}' localhost:50053 microservices.OrderService/CreateOrder
\`\`\`

**Response includes Stripe PaymentIntent:**
\`\`\`json
{
  "id": "order-uuid",
  "buyerId": "user-id",
  "productId": "product-uuid",
  "quantity": 1,
  "totalPrice": 1599.99,
  "status": "pending",
  "paymentStatus": "unpaid",
  "stripePaymentIntentId": "pi_xxxxx"
}
\`\`\`

### 7. Cancel Order (Before Approval)

\`\`\`bash
grpcurl -plaintext -d '{
  "orderId": "order-uuid",
  "token": "USER_JWT_TOKEN"
}' localhost:50053 microservices.OrderService/CancelOrder
\`\`\`

### 8. Update Order Status (Admin Only)

\`\`\`bash
grpcurl -plaintext -d '{
  "orderId": "order-uuid",
  "status": "delivered",
  "token": "ADMIN_JWT_TOKEN"
}' localhost:50053 microservices.OrderService/UpdateOrderStatus
\`\`\`

### 9. Send Message (User to Admin)

\`\`\`bash
grpcurl -plaintext -d '{
  "receiverId": "admin-user-id",
  "message": "Hello, I have a question about my order",
  "token": "USER_JWT_TOKEN"
}' localhost:50054 microservices.ChatService/SendMessage
\`\`\`

**Note:** This will fail if user hasn't received a delivered order!

### 10. Send Message (Admin to User)

\`\`\`bash
grpcurl -plaintext -d '{
  "receiverId": "user-id",
  "message": "Hello! How can I help you?",
  "token": "ADMIN_JWT_TOKEN"
}' localhost:50054 microservices.ChatService/SendMessage
\`\`\`

### 11. List Messages

\`\`\`bash
grpcurl -plaintext -d '{
  "otherUserId": "admin-user-id",
  "token": "USER_JWT_TOKEN",
  "page": 1,
  "limit": 50
}' localhost:50054 microservices.ChatService/ListMessages
\`\`\`

### 12. Validate Chat Permission

\`\`\`bash
grpcurl -plaintext -d '{
  "senderId": "user-id",
  "receiverId": "admin-id"
}' localhost:50054 microservices.ChatService/ValidateChatPermission
\`\`\`

## Stripe Webhook Setup

### Local Development with Stripe CLI

1. **Install Stripe CLI**
   \`\`\`bash
   brew install stripe/stripe-cli/stripe
   \`\`\`

2. **Login to Stripe**
   \`\`\`bash
   stripe login
   \`\`\`

3. **Forward webhooks**
   \`\`\`bash
   stripe listen --forward-to localhost:3000/webhook/stripe
   \`\`\`

4. **Copy webhook secret**
   The CLI will output a webhook secret. Add it to your `.env`:
   \`\`\`env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   \`\`\`

### Production Webhook

Configure webhook endpoint in Stripe Dashboard:
\`\`\`
https://your-domain.com/webhook/stripe
\`\`\`

Events to listen for:
- `payment_intent.succeeded`

## Environment Variables

Complete `.env` configuration:

\`\`\`env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/auth-db

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/microservices

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-use-strong-random-string
JWT_EXPIRES_IN=7d

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Service URLs
AUTH_SERVICE_URL=localhost:50051
PRODUCT_SERVICE_URL=localhost:50052
ORDER_SERVICE_URL=localhost:50053
CHAT_SERVICE_URL=localhost:50054
\`\`\`

## Database Schemas

### Auth Service (MongoDB)

\`\`\`typescript
User {
  _id: ObjectId
  email: string (unique)
  password: string (hashed with bcrypt)
  name: string
  role: "admin" | "user"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
\`\`\`

### Product Service (PostgreSQL)

\`\`\`sql
Product {
  id: UUID (primary key)
  title: VARCHAR
  description: TEXT
  price: DECIMAL
  imageUrl: VARCHAR
  status: ENUM('pending', 'accepted', 'delivered')
  ownerId: VARCHAR
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
\`\`\`

### Order Service (PostgreSQL)

\`\`\`sql
Order {
  id: UUID (primary key)
  buyerId: VARCHAR
  productId: VARCHAR
  quantity: INTEGER
  totalPrice: DECIMAL
  status: ENUM('pending', 'accepted', 'delivered', 'cancelled')
  paymentStatus: ENUM('unpaid', 'paid')
  stripePaymentIntentId: VARCHAR (nullable)
  createdAt: TIMESTAMP
  updatedAt: TIMESTAMP
}
\`\`\`

### Chat Service (MongoDB)

\`\`\`typescript
Message {
  _id: ObjectId
  senderId: string
  receiverId: string
  message: string
  createdAt: Date
}
\`\`\`

## Business Rules

### Product Rules
1. Only admins can create products
2. Only admins can edit products
3. Only admins can update product status
4. Products must be "accepted" status to be ordered
5. Product not found returns gRPC NOT_FOUND error

### Order Rules
1. Only authenticated users can place orders
2. Users cannot order their own products
3. Users can only order "accepted" products
4. Users can cancel orders before admin approval
5. Only admins can update order status
6. Payment confirmation auto-updates status to "accepted"

### Chat Rules
1. **Admins**: Can send messages to anyone
2. **Users**: Can ONLY message admin
3. **Users**: Can only message admin AFTER:
   - User has placed an order
   - Order payment status is "paid"
   - Order status is "delivered"
4. Strict validation enforced server-side

## Security Features

### Authentication
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with role claims
- Token validation on every protected endpoint
- No plain text passwords stored

### Authorization
- Role-based access control
- Guard-based permission checks
- Service-level authorization
- Proper gRPC exception codes

### Payment Security
- Stripe webhook signature verification
- Idempotent webhook handling
- Payment intent metadata tracking
- Secure API key management

### Data Validation
- DTO validation on all inputs
- Type-safe gRPC contracts
- Business rule enforcement
- Proper error responses

## Error Handling

All services return proper gRPC status codes:

- `UNAUTHENTICATED` (401): Invalid or missing token
- `PERMISSION_DENIED` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `INVALID_ARGUMENT` (400): Validation errors
- `UNKNOWN` (500): Internal server errors

## Testing

### End-to-End Flow

1. **Register admin and user**
2. **Admin creates product**
3. **Admin sets product to "accepted"**
4. **User attempts to order (validates ownership)**
5. **Payment processed via Stripe**
6. **Webhook updates order status**
7. **Admin marks order as "delivered"**
8. **User can now message admin**

## Development Commands

\`\`\`bash
# Install all dependencies
npm run bootstrap

# Start all services in dev mode
npm run start:dev

# Build all services
npm run build

# Generate Prisma clients
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Start with Docker
npm run docker:up

# Stop Docker services
npm run docker:down

# View Docker logs
npm run docker:logs

# Clean Docker volumes
npm run docker:clean
\`\`\`

## Monitoring & Debugging

### View Logs

\`\`\`bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f chat-service
\`\`\`

### Database Access

\`\`\`bash
# PostgreSQL
docker exec -it postgres psql -U postgres -d microservices

# MongoDB
docker exec -it mongo mongosh auth-db

# Prisma Studio
cd services/product-service && npx prisma studio
\`\`\`

## Production Considerations

1. **Security**
   - Use strong JWT secrets
   - Enable TLS/SSL for gRPC
   - Implement rate limiting
   - Use environment-specific secrets

2. **Scaling**
   - Deploy services independently
   - Use load balancers
   - Implement caching (Redis)
   - Database read replicas

3. **Monitoring**
   - Add distributed tracing
   - Implement health checks
   - Set up alerting
   - Log aggregation

4. **Stripe**
   - Use production API keys
   - Configure production webhooks
   - Implement retry logic
   - Monitor payment failures

## Common Issues

### Token Validation Fails
- Ensure JWT_SECRET matches across services
- Check token hasn't expired (7 days default)
- Verify Bearer token format in metadata

### Webhook Not Receiving Events
- Check Stripe CLI is running
- Verify STRIPE_WEBHOOK_SECRET is set
- Ensure port 3000 is accessible
- Check webhook signature validation

### Chat Permission Denied
- Verify user has delivered order
- Check order payment status is "paid"
- Ensure order status is "delivered"
- Admin tokens have full access

### Service Connection Errors
- Wait for database health checks
- Verify service URLs in environment
- Check Docker network connectivity
- Ensure proto file is synchronized

## Technology Stack

- **Framework**: NestJS 10.x
- **Communication**: gRPC with @grpc/grpc-js
- **Databases**: MongoDB 6.x, PostgreSQL 15.x
- **ORMs**: Mongoose 8.x, Prisma 5.x
- **Authentication**: JWT with bcrypt
- **Payment**: Stripe 14.x
- **Validation**: class-validator, class-transformer
- **Containerization**: Docker & Docker Compose

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md) - Detailed system design
- [gRPC Documentation](https://grpc.io/docs/)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)

## License

MIT

## Support

For issues, questions, or contributions, please open an issue or pull request in the repository.
