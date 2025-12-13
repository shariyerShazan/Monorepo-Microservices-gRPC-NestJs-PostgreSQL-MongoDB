import { IsString, IsNumber, Min, IsOptional } from "class-validator"

export class ListOrdersDto {
  @IsString()
  userId: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}
