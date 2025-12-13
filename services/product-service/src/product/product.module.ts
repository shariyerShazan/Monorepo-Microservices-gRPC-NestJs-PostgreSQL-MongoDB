import { Module } from "@nestjs/common"
import { ClientsModule, Transport } from "@nestjs/microservices"
import { ProductController } from "./product.controller"
import { ProductService } from "./product.service"
import { PrismaService } from "../prisma/prisma.service"
import { join } from "path"

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "AUTH_SERVICE",
        transport: Transport.GRPC,
        options: {
          url: process.env.AUTH_SERVICE_URL || "localhost:50051",
          package: "microservices",
          protoPath: join(__dirname, "../../../protos/microservices.proto"),
        },
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService, PrismaService],
})
export class ProductModule {}
