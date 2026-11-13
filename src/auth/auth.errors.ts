import { DomainError } from '../common/domain-error';

export class EmailAlreadyUsedError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_USED', 'This email is already associated with an account');
  }
}

/** Same error for an unknown email and a wrong password: never reveal which one is wrong. */
export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Invalid credentials');
  }
}

export class AccountLockedError extends DomainError {
  constructor(lockedUntil: Date) {
    super('ACCOUNT_LOCKED', 'Too many failed attempts, account temporarily locked', {
      lockedUntil: lockedUntil.toISOString(),
    });
  }
}

export class AccountSuspendedError extends DomainError {
  constructor() {
    super('ACCOUNT_SUSPENDED', 'This account has been suspended');
  }
}

export class NotAuthenticatedError extends DomainError {
  constructor() {
    super('NOT_AUTHENTICATED', 'Authentication required');
  }
}