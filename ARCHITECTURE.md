# System Architecture Documentation

## Overview

This document provides detailed information about the architectural decisions, inter-service communication patterns, and data flow in the NestJS microservices system.

## Service Communication

### gRPC Protocol

All services communicate using gRPC with Protocol Buffers for efficient binary serialization.

**Advantages:**
- Type-safe communication
- Efficient binary protocol
- Built-in load balancing
- Bidirectional streaming support
- Language agnostic

### Service Dependencies

```
┌──────────────┐
│ Auth Service │
│  (MongoDB)   │
└───────┬──────┘
        │
        │ Validates tokens
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│Product Service│  │ Order Service│
│ (PostgreSQL)  │  │ (PostgreSQL) │
└───────┬───────┘  └───────┬──────┘
        │                   │
        │  Get product      │ List orders
        │  details          │ for chat
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
          ┌──────────────┐
          │ Chat Service │
          │  (MongoDB)   │
          └──────────────┘
```

## Data Models

### Auth Service (MongoDB)

```typescript
User {
  _id: ObjectId
  email: string (unique)
  password: string (hashed)
  name: string
  role: "admin" | "user"
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}
```

### Product Service (PostgreSQL)

```sql
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
```

### Order Service (PostgreSQL)

```sql
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
```

### Chat Service (MongoDB)

```typescript
Message {
  _id: ObjectId
  senderId: string
  receiverId: string
  message: string
  createdAt: Date
}
```

## Authorization Flow

### 1. User Registration/Login

```
Client → Auth Service: Register/Login
Auth Service: Hash password, create user
Auth Service: Generate JWT with { userId, email, role }
Auth Service → Client: Return token
```

### 2. Protected Operation

```
Client → Service: Request with JWT token
Service → Auth Service: ValidateToken(token)
Auth Service: Verify JWT, lookup user
Auth Service → Service: Return { valid, userId, email, role }
Service: Check role permissions
Service: Execute business logic
Service → Client: Return response
```

## Business Logic Flows

### Create Order with Payment

```
1. Client → Order Service: CreateOrder { productId, quantity, token }
2. Order Service → Auth Service: ValidateToken(token)
3. Auth Service → Order Service: { valid, userId, role }
4. Order Service → Product Service: GetProduct(productId)
5. Product Service → Order Service: Product details
6. Order Service: Validate business rules:
   - User != Product owner
   - Product status == "accepted"
7. Order Service → Stripe API: Create PaymentIntent
8. Stripe API → Order Service: PaymentIntent { id, client_secret }
9. Order Service → Database: Create order with stripePaymentIntentId
10. Order Service → Client: Order details + payment info
11. Client → Stripe: Complete payment
12. Stripe → Order Service Webhook: payment_intent.succeeded
13. Order Service: Update order:
    - paymentStatus = "paid"
    - status = "accepted"
```

### Chat Permission Validation

```
1. Client → Chat Service: SendMessage { receiverId, message, token }
2. Chat Service → Auth Service: ValidateToken(token)
3. Auth Service → Chat Service: { valid, userId, role }
4. IF sender.role == "admin":
   - Allow message (admins can message anyone)
5. ELSE:
   a. Chat Service → Auth Service: GetUserById(receiverId)
   b. IF receiver.role != "admin":
      - Deny (users can only message admin)
   c. Chat Service → Order Service: ListOrders(userId)
   d. Order Service → Chat Service: List of user's orders
   e. Check if any order has:
      - status == "delivered"
      - paymentStatus == "paid"
   f. IF no delivered orders:
      - Deny (user must have purchased product)
6. Chat Service → Database: Save message
7. Chat Service → Client: Message sent confirmation
```

## Security Considerations

### Password Security
- Passwords hashed using bcrypt with 10 salt rounds
- Never stored in plain text
- JWT secret rotation recommended every 90 days

### Token Management
- JWT expires after 7 days (configurable)
- Include minimal data in JWT payload
- Validate on every request
- Implement token refresh mechanism for production

### gRPC Security
- Production should use TLS/SSL
- Implement mutual TLS (mTLS) for service-to-service
- Use API Gateway for external access
- Rate limiting per service

### Payment Security
- Stripe webhook signatures always verified
- Payment intents include metadata for reconciliation
- Idempotency keys for duplicate prevention
- PCI compliance through Stripe

## Scaling Considerations

### Horizontal Scaling
- All services are stateless
- Can run multiple instances behind load balancer
- Use service mesh (Istio, Linkerd) for advanced routing

### Database Scaling
- PostgreSQL: Read replicas for read-heavy operations
- MongoDB: Sharding for large datasets
- Consider caching layer (Redis) for frequently accessed data

### Performance Optimizations
- Implement database indexing on frequently queried fields
- Use connection pooling
- Enable gRPC multiplexing
- Implement circuit breakers for resilience

## Monitoring & Observability

### Metrics to Track
- Request rate per service
- Error rate and types
- Response time (p50, p95, p99)
- Database connection pool usage
- gRPC connection state

### Logging Strategy
- Structured logging (JSON format)
- Include correlation IDs across services
- Log levels: ERROR, WARN, INFO, DEBUG
- Centralized logging (ELK, Loki)

### Health Checks
- Liveness: Service is running
- Readiness: Service can handle requests
- Database connectivity checks
- Dependent service checks

## Future Enhancements

1. **Event-Driven Architecture**
   - Add message queue (RabbitMQ, Kafka)
   - Publish events for order status changes
   - Enable async processing

2. **Caching Layer**
   - Redis for frequently accessed data
   - Cache product listings
   - Cache user sessions

3. **API Gateway**
   - Single entry point for all services
   - Authentication at gateway level
   - Rate limiting and throttling

4. **Service Discovery**
   - Consul or Eureka
   - Dynamic service registration
   - Health check integration

5. **Observability**
   - Distributed tracing (Jaeger, Zipkin)
   - APM tools (New Relic, Datadog)
   - Real-time alerting

