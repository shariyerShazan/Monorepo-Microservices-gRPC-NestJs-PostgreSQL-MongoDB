import { NestFactory } from "@nestjs/core"
import { type MicroserviceOptions, Transport } from "@nestjs/microservices"
import { AppModule } from "./app.module"
import { join } from "path"

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: "microservices",
      protoPath: join(__dirname, "../../../protos/microservices.proto"),
      url: `0.0.0.0:${process.env.AUTH_SERVICE_PORT || 50051}`,
    },
  })

  await app.listen()
  console.log(`Auth Service is running on port ${process.env.AUTH_SERVICE_PORT || 50051}`)
}

bootstrap()
