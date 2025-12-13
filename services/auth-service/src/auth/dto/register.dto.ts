import { IsEmail, IsString, MinLength, IsOptional, IsIn } from "class-validator"

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  @MinLength(2)
  name: string

  @IsOptional()
  @IsString()
  @IsIn(["user", "admin"])
  role?: string
}
