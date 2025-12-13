import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { OrderModule } from "./order/order.module"
// import { WebhookModule } from "./webhook/webhook.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    OrderModule,
    // WebhookModule,
  ],
})
export class AppModule {}
