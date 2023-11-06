import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map, tap } from 'rxjs';
/* eslint-disable */
export interface Response<T> {
  message: string;
  success: boolean;
  result: any;
  error: null;
  timestamps: Date;
  statusCode: number;
  path: string;
}
/* eslint-enable */

// Use Response mapping

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const now = Date.now();
    console.log(`Before sending the response...`);
    const statusCode: number = context.switchToHttp().getResponse().statusCode;
    const path: string = context.switchToHttp().getRequest().url;
    return next.handle().pipe(
      map((data: Response<T>) => ({
        message: data.message,
        success: data.success,
        result: data.result,
        timestamps: new Date(),
        statusCode,
        path,
        error: null,
      })),
      tap(() => {
        console.log(
          `After sending the response. Time taken: ${Date.now() - now}ms`,
        );
      }),
    );
  }
}
