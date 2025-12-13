import { IsString, MinLength } from "class-validator"

export class SendMessageDto {
  @IsString()
  receiverId: string

  @IsString()
  @MinLength(1)
  message: string

  @IsString()
  token: string
}
