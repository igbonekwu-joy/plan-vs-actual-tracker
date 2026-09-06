// tests/auth/login.test.ts
import request from 'supertest';
import app from '../../src/app';
import { connectTestDb, clearTestDb, closeTestDb } from '../setup/testDb';
import { RefreshToken } from '../../src/models/RefreshToken';

beforeAll(connectTestDb);
afterEach(clearTestDb);
afterAll(closeTestDb);

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send({ email: 'joy@example.com', password: 'password123' });
  });

  it('returns 200 and a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joy@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ])
    );
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joy@example.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  it('logs out, revokes the refresh token, and clears auth cookies', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'joy@example.com', password: 'password123' });

    expect(await RefreshToken.countDocuments()).toBe(1);

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', login.headers['set-cookie']);

    expect(logout.status).toBe(200);
    expect(logout.body.message).toBe('Logout successful');
    expect(await RefreshToken.countDocuments()).toBe(0);
    expect(logout.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^access_token=;.*Expires=Thu, 01 Jan 1970 00:00:00 GMT/),
        expect.stringMatching(/^refresh_token=;.*Expires=Thu, 01 Jan 1970 00:00:00 GMT/),
      ])
    );
  });
});