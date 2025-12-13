import { Module } from "@nestjs/common"
import { WebhookController } from "./webhook.controller"
import { OrderModule } from "../order/order.module"

@Module({
  imports: [OrderModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
