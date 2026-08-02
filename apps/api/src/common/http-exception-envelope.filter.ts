import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Opt-in per controller/method (convention #19), pairs with
 * ResponseEnvelopeInterceptor. Throw `new BadRequestException({ code, message, details })`
 * to control `code`; otherwise it's derived from the exception class name.
 */
@Catch(HttpException)
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const envelope: ErrorEnvelope = { error: this.normalize(body, exception) };
    response.status(status).json(envelope);
  }

  private normalize(body: unknown, exception: HttpException) {
    if (typeof body === 'object' && body !== null) {
      const b = body as Record<string, unknown>;
      return {
        code:
          typeof b.code === 'string' ? b.code : this.defaultCode(exception),
        message:
          typeof b.message === 'string' ? b.message : exception.message,
        details: b.details ?? (Array.isArray(b.issues) ? b.issues : undefined),
      };
    }
    return {
      code: this.defaultCode(exception),
      message: exception.message,
      details: undefined,
    };
  }

  private defaultCode(exception: HttpException): string {
    return exception.constructor.name
      .replace(/Exception$/, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
      .toUpperCase();
  }
}
