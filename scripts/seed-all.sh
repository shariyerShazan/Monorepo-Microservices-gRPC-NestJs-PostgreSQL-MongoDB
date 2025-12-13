#!/bin/bash

echo "Seeding all databases..."

# Wait for services to be ready
sleep 5

# Seed auth service (MongoDB)
echo "Seeding auth service..."
cd services/auth-service
npm run seed
cd ../..

# Seed product service (PostgreSQL)
echo "Seeding product service..."
cd services/product-service
npm run prisma:seed
cd ../..

# Seed order service (PostgreSQL)
echo "Seeding order service..."
cd services/order-service
npm run prisma:seed
cd ../..

echo "All databases seeded successfully!"
