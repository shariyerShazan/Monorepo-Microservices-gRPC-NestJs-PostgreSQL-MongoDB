import { IsString } from "class-validator"

export class GetOrderDto {
  @IsString()
  id: string
}
