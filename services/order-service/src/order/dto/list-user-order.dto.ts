import { IsString, IsNumber, IsOptional, Min } from "class-validator"

export class ListUserOrdersDto {
  @IsString()
  token: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number
}
