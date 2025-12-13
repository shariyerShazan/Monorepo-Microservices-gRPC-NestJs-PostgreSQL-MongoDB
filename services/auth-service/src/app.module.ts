import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { MongooseModule } from "@nestjs/mongoose"
import { JwtModule } from "@nestjs/jwt"
import { AuthModule } from "./auth/auth.module"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URI || "mongodb://mongo:27017/auth-db"),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    }),
    AuthModule,
  ],
})
export class AppModule {}
