import { IsString } from "class-validator"

export class GetProductDto {
  @IsString()
  id: string
}
