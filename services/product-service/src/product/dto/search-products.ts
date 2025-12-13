import { IsString, IsNumber, IsOptional, Min } from "class-validator"

export class SearchProductsDto {
  @IsString()
  query: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}
