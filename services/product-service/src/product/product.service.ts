import { Injectable, NotFoundException, ForbiddenException, type OnModuleInit } from "@nestjs/common"
import type { ClientGrpc } from "@nestjs/microservices"
import type { PrismaService } from "../prisma/prisma.service"
import type { CreateProductDto } from "./dto/create-product.dto"
import type { EditProductDto } from "./dto/edit-product.dto"
import type { GetProductDto } from "./dto/get-product.dto"
import type { ListProductsDto } from "./dto/list-products.dto"
import { UpdateProductStatusDto } from "./dto/update-product-stauts.dto"
import { SearchProductsDto } from "./dto/search-products"


interface AuthService {
  validateToken(data: { token: string }): Promise<{ valid: boolean; userId: string; email: string; role: string }>
}

@Injectable()
export class ProductService implements OnModuleInit {
  private authService: AuthService

  constructor(
    private readonly prisma: PrismaService,
    private readonly authClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authService = this.authClient.getService<AuthService>("AuthService")
  }

  async createProduct(createProductDto: CreateProductDto) {
    const validation = await this.authService.validateToken({ token: createProductDto.token })
    if (!validation.valid) {
      throw new ForbiddenException("Invalid token")
    }

    if (validation.role !== "admin") {
      throw new ForbiddenException("Only admins can create products")
    }

    const product = await this.prisma.product.create({
      data: {
        title: createProductDto.title,
        description: createProductDto.description,
        price: createProductDto.price,
        imageUrl: createProductDto.imageUrl || "",
        ownerId: createProductDto.ownerId,
        status: "pending",
      },
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      status: product.status,
      ownerId: product.ownerId,
      createdAt: product.createdAt.toISOString(),
    }
  }

  async editProduct(editProductDto: EditProductDto) {
    const validation = await this.authService.validateToken({ token: editProductDto.token })
    if (!validation.valid) {
      throw new ForbiddenException("Invalid token")
    }

    if (validation.role !== "admin") {
      throw new ForbiddenException("Only admins can edit products")
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: { id: editProductDto.id },
    })

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${editProductDto.id} not found`)
    }

    const product = await this.prisma.product.update({
      where: { id: editProductDto.id },
      data: {
        title: editProductDto.title,
        description: editProductDto.description,
        price: editProductDto.price,
        imageUrl: editProductDto.imageUrl,
      },
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      status: product.status,
      ownerId: product.ownerId,
      createdAt: product.createdAt.toISOString(),
    }
  }

  async updateProductStatus(updateProductStatusDto: UpdateProductStatusDto) {
    const validation = await this.authService.validateToken({ token: updateProductStatusDto.token })
    if (!validation.valid) {
      throw new ForbiddenException("Invalid token")
    }

    if (validation.role !== "admin") {
      throw new ForbiddenException("Only admins can update product status")
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: { id: updateProductStatusDto.id },
    })

    if (!existingProduct) {
      throw new NotFoundException(`Product with ID ${updateProductStatusDto.id} not found`)
    }

    const product = await this.prisma.product.update({
      where: { id: updateProductStatusDto.id },
      data: {
        status: updateProductStatusDto.status,
      },
    })

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      status: product.status,
      ownerId: product.ownerId,
      createdAt: product.createdAt.toISOString(),
    }
  }

  async getProduct(getProductDto: GetProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: getProductDto.id },
    })

    if (!product) {
      throw new NotFoundException(`Product with ID ${getProductDto.id} not found`)
    }

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      status: product.status,
      ownerId: product.ownerId,
      createdAt: product.createdAt.toISOString(),
    }
  }

  async searchProducts(searchProductsDto: SearchProductsDto) {
    const page = searchProductsDto.page || 1
    const limit = searchProductsDto.limit || 10
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: {
          OR: [
            { title: { contains: searchProductsDto.query, mode: "insensitive" } },
            { description: { contains: searchProductsDto.query, mode: "insensitive" } },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count({
        where: {
          OR: [
            { title: { contains: searchProductsDto.query, mode: "insensitive" } },
            { description: { contains: searchProductsDto.query, mode: "insensitive" } },
          ],
        },
      }),
    ])

    return {
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        status: product.status,
        ownerId: product.ownerId,
        createdAt: product.createdAt.toISOString(),
      })),
      total,
    }
  }

  async listProducts(listProductsDto: ListProductsDto) {
    const page = listProductsDto.page || 1
    const limit = listProductsDto.limit || 10
    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.product.count(),
    ])

    return {
      products: products.map((product) => ({
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl,
        status: product.status,
        ownerId: product.ownerId,
        createdAt: product.createdAt.toISOString(),
      })),
      total,
    }
  }
}
