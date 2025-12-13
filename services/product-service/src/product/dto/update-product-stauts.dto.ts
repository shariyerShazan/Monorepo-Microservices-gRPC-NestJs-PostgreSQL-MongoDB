import { IsString, IsIn } from "class-validator"

export class UpdateProductStatusDto {
  @IsString()
  id: string

  @IsString()
  @IsIn(["pending", "accepted", "delivered"])
  status: string

  @IsString()
  token: string
}
