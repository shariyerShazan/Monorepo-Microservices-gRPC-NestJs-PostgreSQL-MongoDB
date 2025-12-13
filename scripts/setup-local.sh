#!/bin/bash

echo "Setting up NestJS Microservices project..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Setup auth-service
echo "Setting up auth-service..."
cd services/auth-service
npm install
cd ../..

# Setup product-service
echo "Setting up product-service..."
cd services/product-service
npm install
npx prisma generate
cd ../..

# Setup order-service
echo "Setting up order-service..."
cd services/order-service
npm install
npx prisma generate
cd ../..

echo "Setup complete! You can now run the services."
echo "For local development: npm run start:dev"
echo "For Docker: npm run docker:up"
