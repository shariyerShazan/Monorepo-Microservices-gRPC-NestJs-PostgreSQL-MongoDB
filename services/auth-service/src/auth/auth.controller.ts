import { Controller } from "@nestjs/common"
import { GrpcMethod } from "@nestjs/microservices"
import type { AuthService } from "./auth.service"
import type { RegisterDto } from "./dto/register.dto"
import type { LoginDto } from "./dto/login.dto"
import type { ValidateTokenDto } from "./dto/validate-token.dto"
import type { GetUserByIdDto } from "./dto/get-user-by-id.dto"

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod("AuthService", "Register")
  async register(data: RegisterDto) {
    return this.authService.register(data)
  }

  @GrpcMethod("AuthService", "Login")
  async login(data: LoginDto) {
    return this.authService.login(data)
  }

  @GrpcMethod("AuthService", "ValidateToken")
  async validateToken(data: ValidateTokenDto) {
    return this.authService.validateToken(data)
  }

  @GrpcMethod("AuthService", "GetUserById")
  async getUserById(data: GetUserByIdDto) {
    return this.authService.getUserById(data)
  }
}
