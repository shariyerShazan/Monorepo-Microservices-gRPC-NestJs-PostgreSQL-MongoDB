import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { ClientsModule, Transport } from "@nestjs/microservices"
import { ChatController } from "./chat.controller"
import { ChatService } from "./chat.service"
import { Message, MessageSchema } from "./schemas/message.schema"
import { join } from "path"

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
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
        name: "ORDER_SERVICE",
        transport: Transport.GRPC,
        options: {
          package: "microservices",
          protoPath: join(__dirname, "../../../../protos/microservices.proto"),
          url: process.env.ORDER_SERVICE_URL || "order-service:50053",
        },
      },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
