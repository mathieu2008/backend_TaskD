export const REGISTRABLE_ROLES = ['delegator', 'collaborator'] as const;
export type RegistrableRole = (typeof REGISTRABLE_ROLES)[number];
/** "admin" exists but can never be chosen at sign-up. */
export type Role = RegistrableRole | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface LoginThrottleState {
  failedLoginCount: number;
  lastFailedLoginAt: Date | null;
  lockedUntil: Date | null;
}

export interface User extends LoginThrottleState {
  id: string;
  lastName: string;
  firstNames: string;
  phone: string;
  email: string;
  profession: string;
  passwordHash: string;
  roles: Role[];
  status: AccountStatus;
  termsAcceptedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<
  User,
  'lastName' | 'firstNames' | 'phone' | 'email' | 'profession' | 'passwordHash' | 'roles' | 'termsAcceptedAt'
>;