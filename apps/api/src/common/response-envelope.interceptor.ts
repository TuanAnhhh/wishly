import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  data: T;
}

/**
 * Opt-in per controller/method (convention #19). Never register globally —
 * that would change the response shape of every P01-P06 endpoint.
 */
@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
