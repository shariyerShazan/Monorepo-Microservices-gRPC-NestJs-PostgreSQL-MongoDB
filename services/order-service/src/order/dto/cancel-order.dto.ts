import { IsString } from "class-validator"

export class CancelOrderDto {
  @IsString()
  orderId: string

  @IsString()
  token: string
}
