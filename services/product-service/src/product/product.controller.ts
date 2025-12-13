import { Controller } from "@nestjs/common"
import { GrpcMethod } from "@nestjs/microservices"
import type { ProductService } from "./product.service"
import type { CreateProductDto } from "./dto/create-product.dto"
import type { EditProductDto } from "./dto/edit-product.dto"
import type { GetProductDto } from "./dto/get-product.dto"
import type { ListProductsDto } from "./dto/list-products.dto"
import { UpdateProductStatusDto } from "./dto/update-product-stauts.dto"
import { SearchProductsDto } from "./dto/search-products"


@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @GrpcMethod("ProductService", "CreateProduct")
  async createProduct(data: CreateProductDto) {
    return this.productService.createProduct(data)
  }

  @GrpcMethod("ProductService", "EditProduct")
  async editProduct(data: EditProductDto) {
    return this.productService.editProduct(data)
  }

  @GrpcMethod("ProductService", "UpdateProductStatus")
  async updateProductStatus(data: UpdateProductStatusDto) {
    return this.productService.updateProductStatus(data)
  }

  @GrpcMethod("ProductService", "GetProduct")
  async getProduct(data: GetProductDto) {
    return this.productService.getProduct(data)
  }

  @GrpcMethod("ProductService", "SearchProducts")
  async searchProducts(data: SearchProductsDto) {
    return this.productService.searchProducts(data)
  }

  @GrpcMethod("ProductService", "ListProducts")
  async listProducts(data: ListProductsDto) {
    return this.productService.listProducts(data)
  }
}
