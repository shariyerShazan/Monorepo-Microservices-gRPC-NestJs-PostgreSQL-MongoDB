import { IsNumber, Min, IsOptional } from "class-validator"

export class ListProductsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}
