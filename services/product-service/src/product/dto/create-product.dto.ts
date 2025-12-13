import { IsString, IsNumber, Min, MinLength, IsOptional, IsUrl } from "class-validator"

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  title: string

  @IsString()
  @MinLength(10)
  description: string

  @IsNumber()
  @Min(0)
  price: number

  @IsOptional()
  @IsUrl()
  imageUrl?: string

  @IsString()
  ownerId: string

  @IsString()
  token: string
}
