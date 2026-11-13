import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';

let app: INestApplication;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'a-test-secret-with-at-least-32-characters';
  delete process.env.DATABASE_URL; // in-memory repository

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
});

afterAll(async () => {
  await app.close();
});

function buildSignUpPayload(overrides: Record<string, unknown> = {}) {
  return {
    lastName: 'Doe',
    firstNames: 'Jane',
    phone: '+22901020304',
    email: `${randomUUID()}@example.com`,
    profession: 'Web designer',
    password: 'Secret123',
    acceptTerms: true,
    role: 'delegator',
    ...overrides,
  };
}

describe('US-03 — Sign up as a delegator (HTTP)', () => {
  it('Given a valid form, When the visitor posts it, Then the API answers 201', async () => {
    const payload = buildSignUpPayload();

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(201);
  });

  it('Given a valid form, When the visitor posts it, Then the session cookie is HttpOnly', async () => {
    const payload = buildSignUpPayload();

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(String(response.headers['set-cookie'])).toContain('HttpOnly');
  });

  it('Given a valid form, When the visitor posts it, Then the answer never contains the password hash', async () => {
    const payload = buildSignUpPayload();

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.body).not.toHaveProperty('passwordHash');
  });

  it('Given an email already used, When another visitor posts it, Then the API answers 409', async () => {
    const payload = buildSignUpPayload();
    await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(409);
  });

  it('Given a password without digit, When the visitor posts the form, Then the API answers 400', async () => {
    const payload = buildSignUpPayload({ password: 'OnlyLetters' });

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(400);
  });

  it('Given the admin role, When the visitor posts the form, Then the API answers 400', async () => {
    const payload = buildSignUpPayload({ role: 'admin' });

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(400);
  });

  it('Given an unknown extra field, When the visitor posts the form, Then the API answers 400', async () => {
    const payload = buildSignUpPayload({ isAdmin: true });

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(400);
  });

  it('Given terms not accepted, When the visitor posts the form, Then the API answers 400', async () => {
    const payload = buildSignUpPayload({ acceptTerms: false });

    const response = await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    expect(response.status).toBe(400);
  });
});

describe('US-05 — Log in (HTTP)', () => {
  it('Given a registered account, When the user logs in, Then the API answers 201', async () => {
    const payload = buildSignUpPayload();
    await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    const response = await request(app.getHttpServer())
      .post('/api/v1/sessions')
      .send({ identifier: payload.email, password: 'Secret123' });

    expect(response.status).toBe(201);
  });

  it('Given a registered account, When the user logs in with a wrong password, Then the API answers 401', async () => {
    const payload = buildSignUpPayload();
    await request(app.getHttpServer()).post('/api/v1/users').send(payload);

    const response = await request(app.getHttpServer())
      .post('/api/v1/sessions')
      .send({ identifier: payload.email, password: 'Wrong1234' });

    expect(response.status).toBe(401);
  });

  it('Given a logged-in user, When the user asks for their own profile, Then the API answers 200', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/users').send(buildSignUpPayload());

    const response = await agent.get('/api/v1/users/me');

    expect(response.status).toBe(200);
  });

  it('Given a visitor without session, When the visitor asks for a profile, Then the API answers 401', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/users/me');

    expect(response.status).toBe(401);
  });

  it('Given a logged-in user, When the user logs out, Then the API answers 204', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/users').send(buildSignUpPayload());

    const response = await agent.delete('/api/v1/sessions/current');

    expect(response.status).toBe(204);
  });
});