import { Injectable, UnauthorizedException, NotFoundException } from "@nestjs/common"
import type { JwtService } from "@nestjs/jwt"
import type { Model } from "mongoose"
import * as bcrypt from "bcrypt"
import type { UserDocument } from "./schemas/user.schema"
import type { RegisterDto } from "./dto/register.dto"
import type { LoginDto } from "./dto/login.dto"
import type { ValidateTokenDto } from "./dto/validate-token.dto"
import type { GetUserByIdDto } from "./dto/get-user-by-id.dto"

@Injectable()
export class AuthService {
  private userModel: Model<UserDocument>
  private jwtService: JwtService

  constructor(userModel: Model<UserDocument>, jwtService: JwtService) {
    this.userModel = userModel
    this.jwtService = jwtService
  }

  async register(registerDto: RegisterDto) {
    const { email, password, name, role } = registerDto

    const existingUser = await this.userModel.findOne({ email })
    if (existingUser) {
      throw new UnauthorizedException("Email already exists")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new this.userModel({
      email,
      password: hashedPassword,
      name,
      role: role || "user", // Default to user role
    })

    await user.save()

    const token = this.jwtService.sign({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return {
      userId: user._id.toString(),
      token,
      message: "User registered successfully",
      role: user.role,
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    const user = await this.userModel.findOne({ email })
    if (!user) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials")
    }

    const token = this.jwtService.sign({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    return {
      userId: user._id.toString(),
      token,
      message: "Login successful",
      role: user.role,
    }
  }

  async validateToken(validateTokenDto: ValidateTokenDto) {
    try {
      const { token } = validateTokenDto
      const decoded = this.jwtService.verify(token)

      const user = await this.userModel.findById(decoded.userId)
      if (!user || !user.isActive) {
        return { valid: false, userId: "", email: "", role: "" }
      }

      return {
        valid: true,
        userId: decoded.userId,
        email: decoded.email,
        role: user.role,
      }
    } catch (error) {
      return { valid: false, userId: "", email: "", role: "" }
    }
  }

  async getUserById(getUserByIdDto: GetUserByIdDto) {
    const { userId } = getUserByIdDto

    const user = await this.userModel.findById(userId)
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    }
  }
}
