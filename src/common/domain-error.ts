/** A business error: it knows nothing about HTTP. The filter translates it. */
export class DomainError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly extensions: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export type FieldError = { field: string; messages: string[] };

export class ValidationFailedError extends DomainError {
  constructor(fields: FieldError[]) {
    super('VALIDATION_FAILED', 'Request validation failed', { errors: fields });
  }
}