import { IsString, IsIn } from "class-validator"

export class UpdateOrderStatusDto {
  @IsString()
  orderId: string

  @IsString()
  @IsIn(["pending", "accepted", "delivered", "cancelled"])
  status: string

  @IsString()
  token: string
}
