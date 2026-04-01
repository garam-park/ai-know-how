import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface APIResponse<T = Record<string, unknown>> {
  code: number;
  message?: string;
  result: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, APIResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<APIResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        // If the controller already returns APIResponse format, pass through
        if (data && typeof data === 'object' && 'code' in data && 'result' in data) {
          return data as unknown as APIResponse<T>;
        }
        return {
          code: statusCode * 1000,
          result: data,
        };
      }),
    );
  }
}
