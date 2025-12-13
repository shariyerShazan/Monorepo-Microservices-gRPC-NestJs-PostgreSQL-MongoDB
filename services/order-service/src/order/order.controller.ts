import { Controller } from "@nestjs/common"
import { GrpcMethod } from "@nestjs/microservices"
import type { OrderService } from "./order.service"
import type { CreateOrderDto } from "./dto/create-order.dto"
import type { CancelOrderDto } from "./dto/cancel-order.dto"
import { UpdateOrderStatusDto } from "./dto/update-order-status"
import { GetOrderDto } from "./dto/get-order.dt"
import { ListOrdersDto } from "./dto/list-order.dto"
import { ListUserOrdersDto } from "./dto/list-user-order.dto"


@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @GrpcMethod("OrderService", "CreateOrder")
  async createOrder(data: CreateOrderDto) {
    return this.orderService.createOrder(data)
  }

  @GrpcMethod("OrderService", "CancelOrder")
  async cancelOrder(data: CancelOrderDto) {
    return this.orderService.cancelOrder(data)
  }

  @GrpcMethod("OrderService", "UpdateOrderStatus")
  async updateOrderStatus(data: UpdateOrderStatusDto) {
    return this.orderService.updateOrderStatus(data)
  }

  @GrpcMethod("OrderService", "GetOrder")
  async getOrder(data: GetOrderDto) {
    return this.orderService.getOrder(data)
  }

  @GrpcMethod("OrderService", "ListOrders")
  async listOrders(data: ListOrdersDto) {
    return this.orderService.listOrders(data)
  }

  @GrpcMethod("OrderService", "ListUserOrders")
  async listUserOrders(data: ListUserOrdersDto) {
    return this.orderService.listUserOrders(data)
  }
}
