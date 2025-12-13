import { Controller, Post, type RawBodyRequest, Req, BadRequestException } from "@nestjs/common"
import type { Request } from "express"
import Stripe from "stripe"
import type { OrderService } from "../order/order.service"

@Controller("webhook")
export class WebhookController {
  private stripe: Stripe

  constructor(private readonly orderService: OrderService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2023-10-16",
    })
  }

  @Post("stripe")
  async handleStripeWebhook(@Req() req: RawBodyRequest<Request>) {
    const signature = req.headers["stripe-signature"]
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header")
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
      throw new BadRequestException("Stripe webhook secret not configured")
    }

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(req.rawBody || req.body, signature, webhookSecret)
    } catch (err: any) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`)
    }

    await this.orderService.handleStripeWebhook(event)

    return { received: true }
  }
}
