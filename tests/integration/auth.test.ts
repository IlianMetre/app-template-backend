import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import {
  createTestApp,
  closeTestApp,
  cleanDatabase,
} from '../helpers/setup.js';
import { createTestUser, loginAs } from '../helpers/auth.js';
import { TEST_USER } from '../helpers/fixtures.js';

describe('Auth endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await cleanDatabase();
    await closeTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials and return user data', async () => {
      await createTestUser();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.message).toBe('Login successful');
      expect(body.user.email).toBe(TEST_USER.email);
      expect(body.user.displayName).toBe(TEST_USER.displayName);
      expect(body.user.role).toBe('USER');
      // Should not expose sensitive fields
      expect(body.user.passwordHash).toBeUndefined();
    });

    it('should set a session cookie on successful login', async () => {
      await createTestUser();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: TEST_USER.email,
          password: TEST_USER.password,
        },
      });

      expect(response.statusCode).toBe(200);
      const setCookie = response.headers['set-cookie'];
      expect(setCookie).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      await createTestUser();

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: TEST_USER.email,
          password: 'WrongPassword!',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.message).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent email', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nobody@example.com',
          password: 'SomePassword123!',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = response.json();
      expect(body.message).toBe('Invalid email or password');
    });

    it('should return 400 for invalid input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'not-an-email',
          password: '',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout an authenticated user', async () => {
      await createTestUser();
      const { cookies } = await loginAs(app);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie: cookies },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.message).toBe('Logged out successfully');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/logout',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should invalidate the session after logout', async () => {
      await createTestUser();
      const { cookies } = await loginAs(app);

      // Logout
      await app.inject({
        method: 'POST',
        url: '/auth/logout',
        headers: { cookie: cookies },
      });

      // Try to access protected route with old session
      const meResponse = await app.inject({
        method: 'GET',
        url: '/me',
        headers: { cookie: cookies },
      });

      expect(meResponse.statusCode).toBe(401);
    });
  });
});
