import { describe, expect, it } from 'vitest';
import { buildAuthService, buildRegisterInput, failLogin } from '../../test/helpers';
import {
  AccountLockedError,
  AccountSuspendedError,
  EmailAlreadyUsedError,
  InvalidCredentialsError,
} from './auth.errors';

describe('US-03 — Sign up as a delegator', () => {
  it('Given a valid form, When the visitor signs up as delegator, Then the account has the delegator role', async () => {
    const { service } = buildAuthService();

    const user = await service.register(buildRegisterInput({ role: 'delegator' }));

    expect(user.roles).toEqual(['delegator']);
  });

  it('Given a valid form, When the visitor signs up, Then the password is stored hashed', async () => {
    const { service } = buildAuthService();

    const user = await service.register(buildRegisterInput({ password: 'Secret123' }));

    expect(user.passwordHash).not.toBe('Secret123');
  });

  it('Given a valid form, When the visitor signs up, Then a confirmation email is requested', async () => {
    const { service, mailer } = buildAuthService();

    const user = await service.register(buildRegisterInput());

    expect(mailer.welcomedUserIds).toEqual([user.id]);
  });

  it('Given an email already used, When another visitor signs up with it, Then the sign-up is rejected', async () => {
    const { service } = buildAuthService();
    await service.register(buildRegisterInput());

    const secondSignUp = service.register(buildRegisterInput());

    await expect(secondSignUp).rejects.toBeInstanceOf(EmailAlreadyUsedError);
  });
});

describe('US-04 — Sign up as a collaborator', () => {
  it('Given a valid form, When the visitor signs up as collaborator, Then the account has the collaborator role', async () => {
    const { service } = buildAuthService();

    const user = await service.register(buildRegisterInput({ role: 'collaborator' }));

    expect(user.roles).toEqual(['collaborator']);
  });
});

describe('US-05 — Log in', () => {
  it('Given a registered account, When the user logs in with the right password, Then the account is returned', async () => {
    const { service } = buildAuthService();
    await service.register(buildRegisterInput({ email: 'jane@example.com', password: 'Secret123' }));

    const user = await service.login('jane@example.com', 'Secret123');

    expect(user.email).toBe('jane@example.com');
  });

  it('Given an unknown email, When someone logs in, Then the credentials are reported invalid', async () => {
    const { service } = buildAuthService();

    const attempt = service.login('nobody@example.com', 'Secret123');

    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('Given a registered account, When someone logs in with a wrong password, Then the credentials are reported invalid', async () => {
    const { service } = buildAuthService();
    await service.register(buildRegisterInput({ email: 'jane@example.com' }));

    const attempt = service.login('jane@example.com', 'Wrong1234');

    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('Given 4 failed attempts, When a 5th attempt fails, Then the account is locked', async () => {
    const { service } = buildAuthService();
    await service.register(buildRegisterInput({ email: 'jane@example.com' }));
    await failLogin(service, 'jane@example.com', 4);

    const fifthAttempt = service.login('jane@example.com', 'Wrong1234');

    await expect(fifthAttempt).rejects.toBeInstanceOf(AccountLockedError);
  });

  it('Given a locked account, When the owner logs in with the right password, Then the account is still locked', async () => {
    const { service } = buildAuthService();
    await service.register(buildRegisterInput({ email: 'jane@example.com', password: 'Secret123' }));
    await failLogin(service, 'jane@example.com', 5);

    const attempt = service.login('jane@example.com', 'Secret123');

    await expect(attempt).rejects.toBeInstanceOf(AccountLockedError);
  });

  it('Given a locked account, When 16 minutes have passed, Then the owner can log in again', async () => {
    const { service, clock } = buildAuthService();
    await service.register(buildRegisterInput({ email: 'jane@example.com', password: 'Secret123' }));
    await failLogin(service, 'jane@example.com', 5);
    clock.advanceMinutes(16);

    const user = await service.login('jane@example.com', 'Secret123');

    expect(user.email).toBe('jane@example.com');
  });

  it('Given a suspended account, When the owner logs in with the right password, Then the suspension is reported', async () => {
    const { service, users } = buildAuthService();
    const registered = await service.register(buildRegisterInput({ email: 'jane@example.com', password: 'Secret123' }));
    users.setStatusForTests(registered.id, 'suspended');

    const attempt = service.login('jane@example.com', 'Secret123');

    await expect(attempt).rejects.toBeInstanceOf(AccountSuspendedError);
  });
});