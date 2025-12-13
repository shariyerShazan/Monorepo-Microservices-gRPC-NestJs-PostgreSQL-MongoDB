import { Catch, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common"
import { RpcException } from "@nestjs/microservices"
import { status } from "@grpc/grpc-js"

@Catch()
export class GrpcExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const error = exception.response || exception.message || "Internal server error"

    let grpcStatus = status.UNKNOWN

    if (exception.status === 401) {
      grpcStatus = status.UNAUTHENTICATED
    } else if (exception.status === 403) {
      grpcStatus = status.PERMISSION_DENIED
    } else if (exception.status === 404) {
      grpcStatus = status.NOT_FOUND
    } else if (exception.status === 400) {
      grpcStatus = status.INVALID_ARGUMENT
    }

    throw new RpcException({
      code: grpcStatus,
      message: typeof error === "string" ? error : JSON.stringify(error),
    })
  }
}
