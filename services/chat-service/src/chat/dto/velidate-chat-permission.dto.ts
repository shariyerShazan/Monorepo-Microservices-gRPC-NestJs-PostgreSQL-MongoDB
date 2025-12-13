import { IsString } from "class-validator"

export class ValidateChatPermissionDto {
  @IsString()
  senderId: string

  @IsString()
  receiverId: string
}
