import { Module } from "@nestjs/common"
import { ClientsModule, Transport } from "@nestjs/microservices"
import { OrderController } from "./order.controller"
import { OrderService } from "./order.service"
import { PrismaService } from "../prisma/prisma.service"
import { join } from "path"

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "AUTH_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "microservices",
          protoPath: join(__dirname, "../../../../protos/microservices.proto"),
          url: process.env.AUTH_SERVICE_URL || "auth-service:50051",
        },
      },
      {
        name: "PRODUCT_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "microservices",
          protoPath: join(__dirname, "../../../../protos/microservices.proto"),
          url: process.env.PRODUCT_SERVICE_URL || "product-service:50052",
        },
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, PrismaService],
  exports: [OrderService],
})
export class OrderModule {}
