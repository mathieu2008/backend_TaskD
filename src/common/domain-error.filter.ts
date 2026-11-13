import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainError } from './domain-error';

const statusByCode: Record<string, number> = {
  VALIDATION_FAILED: 400,
  NOT_AUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  ACCOUNT_SUSPENDED: 403,
  EMAIL_ALREADY_USED: 409,
  ACCOUNT_LOCKED: 429,
};

/** Turns every business error into the same "problem details" (RFC 9457) answer. */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(error: DomainError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const status = statusByCode[error.code] ?? 500;

    response.status(status).json({
      type: `https://taskd.example/errors/${error.code.toLowerCase().replaceAll('_', '-')}`,
      title: error.message,
      code: error.code,
      status,
      instance: request.path,
      correlationId: request.headers['x-correlation-id'],
      ...error.extensions,
    });
  }
}