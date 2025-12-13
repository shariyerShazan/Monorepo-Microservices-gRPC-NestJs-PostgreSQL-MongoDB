import { NestFactory } from "@nestjs/core"
import { type MicroserviceOptions, Transport } from "@nestjs/microservices"
import { AppModule } from "./app.module"
import { join } from "path"
import { ValidationPipeX } from "./chat/common/pipes/validation.pipe"
import { GrpcExceptionFilter } from "./chat/common/filters/grpc-exception.filter"


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: "microservices",
      protoPath: join(__dirname, "../../../protos/microservices.proto"),
      url: process.env.GRPC_URL || "0.0.0.0:50054",
    },
  })

  // Ensure hooks are called at the top level
  app.useGlobalPipes(new ValidationPipeX())
  app.useGlobalFilters(new GrpcExceptionFilter())

  await app.listen()
  console.log("Chat Service is listening on port 50054")
}

bootstrap()
