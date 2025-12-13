import { Injectable, ForbiddenException, UnauthorizedException, type OnModuleInit } from "@nestjs/common"
import type { Model } from "mongoose"
import type { ClientGrpc } from "@nestjs/microservices"
import type { MessageDocument } from "./schemas/message.schema"
import type { SendMessageDto } from "./dto/send-message.dto"
import type { ListMessagesDto } from "./dto/list-messages.dto"
import { ValidateChatPermissionDto } from "./dto/validate-chat-permission.dto"

interface AuthService {
  validateToken(data: { token: string }): Promise<{ valid: boolean; userId: string; email: string; role: string }>
  getUserById(data: { userId: string }): Promise<{ id: string; email: string; name: string; role: string }>
}

interface OrderService {
  listOrders(data: { userId: string; page: number; limit: number }): Promise<{
    orders: Array<{
      id: string
      buyerId: string
      productId: string
      status: string
      paymentStatus: string
    }>
    total: number
  }>
}

@Injectable()
export class ChatService implements OnModuleInit {
  private authService: AuthService
  private orderService: OrderService

  constructor(
    private readonly messageModel: Model<MessageDocument>,
    private readonly authClient: ClientGrpc,
    private readonly orderClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthService>("AuthService")
    this.orderService = this.orderClient.getService<OrderService>("OrderService")
  }

  async sendMessage(sendMessageDto: SendMessageDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: sendMessageDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    const senderId = validation.userId
    const receiverId = sendMessageDto.receiverId

    // Check permission
    const permission = await this.validateChatPermission({ senderId, receiverId })
    if (!permission.allowed) {
      throw new ForbiddenException(permission.reason)
    }

    // Create message
    const message = new this.messageModel({
      senderId,
      receiverId,
      message: sendMessageDto.message,
    })

    await message.save()

    return {
      id: message._id.toString(),
      senderId: message.senderId,
      receiverId: message.receiverId,
      message: message.message,
      createdAt: message.createdAt.toISOString(),
    }
  }

  async listMessages(listMessagesDto: ListMessagesDto) {
    // Validate token
    const validation = await this.authService.validateToken({ token: listMessagesDto.token })
    if (!validation.valid) {
      throw new UnauthorizedException("Invalid token")
    }

    const userId = validation.userId
    const otherUserId = listMessagesDto.otherUserId

    const page = listMessagesDto.page || 1
    const limit = listMessagesDto.limit || 50
    const skip = (page - 1) * limit

    // Get all messages between these two users
    const [messages, total] = await Promise.all([
      this.messageModel
        .find({
          $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.messageModel.countDocuments({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      }),
    ])

    return {
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        createdAt: msg.createdAt.toISOString(),
      })),
      total,
    }
  }

  async validateChatPermission(validateDto: ValidateChatPermissionDto): Promise<{ allowed: boolean; reason: string }> {
    const { senderId, receiverId } = validateDto

    try {
      // Get sender info
      const sender = await this.authService.getUserById({ userId: senderId })
      if (!sender) {
        return { allowed: false, reason: "Sender not found" }
      }

      // Get receiver info
      const receiver = await this.authService.getUserById({ userId: receiverId })
      if (!receiver) {
        return { allowed: false, reason: "Receiver not found" }
      }

      // Rule 1: Admin can send message to ANY user
      if (sender.role === "admin") {
        return { allowed: true, reason: "Admin has full access" }
      }

      // Rule 2: User can ONLY send message to admin
      if (receiver.role !== "admin") {
        return { allowed: false, reason: "Users can only send messages to admin" }
      }

      // Rule 3: User can send message to admin ONLY after purchasing a product and it's delivered
      const orders = await this.orderService.listOrders({ userId: senderId, page: 1, limit: 1000 })

      const hasDeliveredOrder = orders.orders.some(
        (order) => order.status === "delivered" && order.paymentStatus === "paid",
      )

      if (!hasDeliveredOrder) {
        return {
          allowed: false,
          reason: "You can only message admin after purchasing and receiving a delivered product",
        }
      }

      return { allowed: true, reason: "User has delivered orders" }
    } catch (error: any) {
      return { allowed: false, reason: `Validation error: ${error.message}` }
    }
  }
}
