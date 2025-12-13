import { Controller } from "@nestjs/common"
import { GrpcMethod } from "@nestjs/microservices"
import type { ChatService } from "./chat.service"
import type { SendMessageDto } from "./dto/send-message.dto"
import type { ListMessagesDto } from "./dto/list-messages.dto"
import { ValidateChatPermissionDto } from "./dto/validate-chat-permission.dto"


@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @GrpcMethod("ChatService", "SendMessage")
  async sendMessage(data: SendMessageDto) {
    return this.chatService.sendMessage(data)
  }

  @GrpcMethod("ChatService", "ListMessages")
  async listMessages(data: ListMessagesDto) {
    return this.chatService.listMessages(data)
  }

  @GrpcMethod("ChatService", "ValidateChatPermission")
  async validateChatPermission(data: ValidateChatPermissionDto) {
    return this.chatService.validateChatPermission(data)
  }
}
