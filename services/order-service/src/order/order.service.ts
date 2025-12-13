import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  type OnModuleInit,
} from "@nestjs/common"
import type { ClientGrpc } from "@nestjs/microservices"
import type { PrismaService } from "../prisma/prisma.service"
import type { CreateOrderDto } from "./dto/create-order.dto"
import type { CancelOrderDto } from "./dto/cancel-order.dto"

import Stripe from "stripe"
import { UpdateOrderStatusDto } from "./dto/update-order-status"
import { ListOrdersDto } from "./dto/list-order.dto"
import { ListUserOrdersDto } from "./dto/list-user-order.dto"
import { GetOrderDto } from "./dto/get-order.dt"

interface AuthService {
  validateToken(data: { token: string }): Promise<{ valid: boolean; userId: string; email: string; role: string }>
}

interface ProductService {
  getProduct(data: { id: string }): Promise<{
    id: string
    title: string
    price: number
    status: string
    ownerId: string
  }>
}

@Injectable()
export class OrderService implements OnModuleInit {
  private authService: AuthService
  private productService: ProductService
  private stripe: Stripe
  private authClient: ClientGrpc
  private productClient: ClientGrpc

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: '2023-10-16',
    })
  }

  onModuleInit() {
    this.authClient = this.prisma.getService<ClientGrpc>("AUTH_SERVICE")
    this.productClient = this.prisma.getService<ClientGrpc>("PRODUCT_SERVICE")
    this.authService = this.authClient.getService<AuthService>("AuthService")
    this.productService = this.productClient.getService<ProductService>("ProductService")
  }

  async createOrder(createOrderDto: CreateOrderDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: createOrderDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    const buyerId = validation.userId

    // Get product details
    const product = await this.productService.getProduct({ id: createOrderDto.productId })
    if (!product) {
      throw new NotFoundException("Product not found")
    }

    // Check if user is trying to order their own product
    if (product.ownerId === buyerId) {
      throw new BadRequestException("You cannot order your own product")
    }

    // Check product status
    if (product.status !== "accepted") {
      throw new BadRequestException(`Product is not available for ordering. Current status: ${product.status}`)
    }

    // Calculate total price
    const totalPrice = product.price * createOrderDto.quantity

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalPrice * 100), // Stripe uses cents
      currency: "usd",
      metadata: {
        productId: createOrderDto.productId,
        buyerId,
        quantity: createOrderDto.quantity.toString(),
      },
    })

    // Create order
    const order = await this.prisma.order.create({
      data: {
        buyerId,
        productId: createOrderDto.productId,
        quantity: createOrderDto.quantity,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        stripePaymentIntentId: paymentIntent.id,
      },
    })

    return {
      id: order.id,
      buyerId: order.buyerId,
      productId: order.productId,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
  }

  async cancelOrder(cancelOrderDto: CancelOrderDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: cancelOrderDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    const order = await this.prisma.order.findUnique({
      where: { id: cancelOrderDto.orderId },
    })

    if (!order) {
      throw new NotFoundException("Order not found")
    }

    // Only the buyer can cancel their order
    if (order.buyerId !== validation.userId) {
      throw new ForbiddenException("You can only cancel your own orders")
    }

    // Can only cancel if status is pending
    if (order.status !== "pending") {
      throw new BadRequestException(`Cannot cancel order with status: ${order.status}`)
    }

    // Cancel Stripe payment intent if exists
    if (order.stripePaymentIntentId) {
      await this.stripe.paymentIntents.cancel(order.stripePaymentIntentId)
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: cancelOrderDto.orderId },
      data: { status: "cancelled" },
    })

    return {
      id: updatedOrder.id,
      buyerId: updatedOrder.buyerId,
      productId: updatedOrder.productId,
      quantity: updatedOrder.quantity,
      totalPrice: updatedOrder.totalPrice,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      stripePaymentIntentId: updatedOrder.stripePaymentIntentId,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
    }
  }

  async updateOrderStatus(updateOrderStatusDto: UpdateOrderStatusDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: updateOrderStatusDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    // Only admins can update order status
    if (validation.role !== "admin") {
      throw new ForbiddenException("Only admins can update order status")
    }

    const order = await this.prisma.order.findUnique({
      where: { id: updateOrderStatusDto.orderId },
    })

    if (!order) {
      throw new NotFoundException("Order not found")
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: updateOrderStatusDto.orderId },
      data: { status: updateOrderStatusDto.status },
    })

    return {
      id: updatedOrder.id,
      buyerId: updatedOrder.buyerId,
      productId: updatedOrder.productId,
      quantity: updatedOrder.quantity,
      totalPrice: updatedOrder.totalPrice,
      status: updatedOrder.status,
      paymentStatus: updatedOrder.paymentStatus,
      stripePaymentIntentId: updatedOrder.stripePaymentIntentId,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString(),
    }
  }

  async getOrder(getOrderDto: GetOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: getOrderDto.id },
    })

    if (!order) {
      throw new NotFoundException("Order not found")
    }

    return {
      id: order.id,
      buyerId: order.buyerId,
      productId: order.productId,
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      status: order.status,
      paymentStatus: order.paymentStatus,
      stripePaymentIntentId: order.stripePaymentIntentId,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    }
  }

  async listOrders(listOrdersDto: ListOrdersDto) {
    const page = listOrdersDto.page || 1
    const limit = listOrdersDto.limit || 10
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: listOrdersDto.userId ? { buyerId: listOrdersDto.userId } : {},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({
        where: listOrdersDto.userId ? { buyerId: listOrdersDto.userId } : {},
      }),
    ])

    return {
      orders: orders.map((order) => ({
        id: order.id,
        buyerId: order.buyerId,
        productId: order.productId,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
      total,
    }
  }

  async listUserOrders(listUserOrdersDto: ListUserOrdersDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: listUserOrdersDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    const page = listUserOrdersDto.page || 1
    const limit = listUserOrdersDto.limit || 10
    const skip = (page - 1) * limit

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { buyerId: validation.userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.order.count({
        where: { buyerId: validation.userId },
      }),
    ])

    return {
      orders: orders.map((order) => ({
        id: order.id,
        buyerId: order.buyerId,
        productId: order.productId,
        quantity: order.quantity,
        totalPrice: order.totalPrice,
        status: order.status,
        paymentStatus: order.paymentStatus,
        stripePaymentIntentId: order.stripePaymentIntentId,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
      total,
    }
  }

  async handleStripeWebhook(event: Stripe.Event) {
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent

      const order = await this.prisma.order.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
      })

      if (order) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: "paid",
            status: "accepted", // Automatically accept order when paid
          },
        })
      }
    }
  }
}
